import { RedisService } from '@songkeys/nestjs-redis';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AppConfig,
  AwsSESService,
  CustomError,
  CustomLoggerService,
  ErrorType,
  ModelNames,
  IServiceProviderModel,
  PendingServiceProvider,
  IPendingServiceProviderModel,
  AwsCognitoService,
  AwsS3Service,
  IBranchAccessControlModel,
  IBrandMembershipModel,
  ServiceProviderStatusEnum,
  ServiceProviderEventsEnum,
} from '@instapets-backend/common';
import { HydratedDocument, Types } from 'mongoose';
import { BaseAuthService } from './base-auth.service';
import { SignupServiceProviderDto } from './dto/signup-serviceprovider.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ITempAccessTokenPayload } from './interfaces/temp-access-token.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { SwitchBranchAccessDto } from './dto/switch-branch-access.dto';
import { TemplateManagerService } from '@instapets-backend/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ServiceProviderAuthService extends BaseAuthService {
  constructor(
    @Inject(ModelNames.PENDING_SERVICE_PROVIDER)
    private pendingServiceProviderModel: IPendingServiceProviderModel,
    @Inject(ModelNames.SERVICE_PROVIDER)
    private _serviceProviderModel: IServiceProviderModel,
    @Inject(ModelNames.BRANCH_ACCESS_CONTROL)
    private branchAccessControlModel: IBranchAccessControlModel,
    @Inject(ModelNames.BRAND_MEMBERSHIP)
    private brandMembershipModel: IBrandMembershipModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
    private readonly sesService: AwsSESService,
    private readonly logger: CustomLoggerService,
    private readonly cognitoService: AwsCognitoService,
    private readonly s3Service: AwsS3Service,
    private readonly templateService: TemplateManagerService,
    private readonly _eventEmitter: EventEmitter2,
  ) {
    super(_serviceProviderModel, _appConfig, _jwtService, _redisService, _eventEmitter);
  }

  async signupServiceProvider(body: SignupServiceProviderDto) {
    const { email } = body;
    const attempts = await this.redis.get(`${email}-signup-trials`);

    if (Number(attempts) >= 5) {
      throw new ForbiddenException(
        new CustomError({
          localizedMessage: {
            en: 'You have exceeded the maximum number of attempts, please try again later',
            ar: 'لقد تجاوزت الحد الأقصى لعدد المحاولات ، يرجى المحاولة مرة أخرى لاحقًا',
          },
          event: 'MAX_ATTEMPTS_EXCEEDED',
          errorType: ErrorType.FORBIDDEN,
        }),
      );
    }

    await this.setRedisAttempts(email, Number(attempts), 'signup-trials');

    const serviceProvider = await this.serviceProviderModel.findOne({ email });

    if (serviceProvider) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'Email Already Exists',
            ar: 'البريد الإلكتروني موجود بالفعل',
          },
          event: 'EMAIL_ALREADY_EXISTS',
          errorType: ErrorType.WRONG_INPUT,
        }),
      );
    }

    let pendingServiceProvider: HydratedDocument<PendingServiceProvider> =
      await this.pendingServiceProviderModel.findOne({ email });

    pendingServiceProvider = pendingServiceProvider || new this.pendingServiceProviderModel();

    pendingServiceProvider.set({
      ...body,
    });

    const savedPendingServiceProvider = (await pendingServiceProvider.save()).toJSON();

    delete savedPendingServiceProvider.password;

    const token = this.generateTempAccessToken(pendingServiceProvider._id?.toString());

    const template = this.templateService.getVerifyServiceProviderEmail(savedPendingServiceProvider.fullName, token);

    await this.sesService.sendEmail({
      emails: email,
      subject: 'Complete your account setup as service provider',
      template,
    });

    return savedPendingServiceProvider;
  }

  async verifySignupEmail({ accessToken }: VerifyEmailDto) {
    const { _id }: ITempAccessTokenPayload = this.validateTempAccessToken(accessToken);

    const pendingServiceProvider = await this.pendingServiceProviderModel.findById(_id);

    if (!pendingServiceProvider) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect email',
            ar: 'البريد الإلكتروني غير صحيح',
          },
          event: 'INCORRECT_EMAIL',
          errorType: ErrorType.WRONG_REQUEST,
        }),
      );
    }

    let newServiceProvider = await this.serviceProviderModel.findOne({ email: pendingServiceProvider.email });
    newServiceProvider = newServiceProvider || new this.serviceProviderModel();

    newServiceProvider.set({
      email: pendingServiceProvider.email,
      password: pendingServiceProvider.password,
      fullName: pendingServiceProvider.fullName,
      phoneNumber: pendingServiceProvider.phoneNumber,
      isSelfResetPassword: true,
    });

    newServiceProvider.unmarkModified('password');

    await newServiceProvider.save();
    await pendingServiceProvider.deleteOne();

    this._eventEmitter.emit(ServiceProviderEventsEnum.SERVICE_PROVIDER_REGISTERED, newServiceProvider);
  }

  async refreshTokens(payload: IRefreshTokenPayload) {
    const { _id: serviceProviderId, sessionId } = payload;

    // Delete current session from redis
    const removeResult = await this.redis.lrem(serviceProviderId, 0, sessionId);

    if (removeResult === 0) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid session',
            ar: 'جلسة غير صالحة',
          },
          event: 'INVALID_SESSION',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }
    const serviceProviderWithTokens = await this.handleServiceProviderLoginAndGenerateTokens(serviceProviderId);

    return serviceProviderWithTokens;
  }

  async resendVerificationEmail({ email }: ResendVerificationEmailDto) {
    const attempts = await this.redis.get(`${email}-resend-verification-trials`);

    if (Number(attempts) >= 5) {
      throw new ForbiddenException(
        new CustomError({
          localizedMessage: {
            en: 'You have exceeded the maximum number of attempts, please try again later',
            ar: 'لقد تجاوزت الحد الأقصى لعدد المحاولات ، يرجى المحاولة مرة أخرى لاحقًا',
          },
          event: 'MAX_ATTEMPTS_EXCEEDED',
          errorType: ErrorType.FORBIDDEN,
        }),
      );
    }

    await this.setRedisAttempts(email, Number(attempts), 'resend-verification-trials');

    const serviceProvider = await this.serviceProviderModel.findOne({ email });

    if (serviceProvider) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'Email Already Exists',
            ar: 'البريد الإلكتروني موجود بالفعل',
          },
          event: 'EMAIL_ALREADY_EXISTS',
          errorType: ErrorType.WRONG_INPUT,
        }),
      );
    }

    const pendingServiceProvider = await this.pendingServiceProviderModel.findOne({ email });

    if (!pendingServiceProvider) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect email',
            ar: 'البريد الإلكتروني غير صحيح',
          },
          event: 'INCORRECT_EMAIL',
          errorType: ErrorType.WRONG_REQUEST,
        }),
      );
    }

    const token = this.generateTempAccessToken(pendingServiceProvider._id?.toString());

    const template = this.templateService.getVerifyServiceProviderEmail(pendingServiceProvider.fullName, token);

    await this.sesService.sendEmail({
      emails: email,
      subject: 'Complete your account setup as service provider',
      template,
    });
  }

  async forgetPassword({ email }: ForgetPasswordDto) {
    const attempts = await this.redis.get(`${email}-forget-password-trials`);

    if (Number(attempts) >= 5) {
      throw new ForbiddenException(
        new CustomError({
          localizedMessage: {
            en: 'You have exceeded the maximum number of attempts, please try again later',
            ar: 'لقد تجاوزت الحد الأقصى لعدد المحاولات ، يرجى المحاولة مرة أخرى لاحقًا',
          },
          event: 'MAX_ATTEMPTS_EXCEEDED',
          errorType: ErrorType.FORBIDDEN,
        }),
      );
    }
    await this.setRedisAttempts(email, Number(attempts), 'forget-password-trials');

    const serviceProvider = await this.serviceProviderModel.findOne({ email });

    if (!serviceProvider) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect email',
            ar: 'البريد الإلكتروني غير صحيح',
          },
          event: 'INCORRECT_EMAIL',
          errorType: ErrorType.WRONG_REQUEST,
        }),
      );
    }

    const token = this.generateTempAccessToken(serviceProvider._id?.toString());

    const template = this.templateService.getResetPasswordEmail(serviceProvider.fullName, token);

    await this.sesService.sendEmail({
      emails: email,
      subject: 'Reset Your PetsyHub Account Password',
      template,
    });
  }

  async resetPassword({ accessToken, newPassword }: ResetPasswordDto) {
    const { _id }: ITempAccessTokenPayload = this.validateTempAccessToken(accessToken);

    const serviceProvider = await this.serviceProviderModel.findById(_id);

    if (!serviceProvider) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid access token',
            ar: 'رمز الوصول غير صالح',
          },
          event: 'INVALID_ACCESS_TOKEN',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    serviceProvider.password = newPassword;

    await serviceProvider.save();

    this._eventEmitter.emit(ServiceProviderEventsEnum.SERVICE_PROVIDER_PASSWORD_CHANGED, serviceProvider);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStorageConfig(serviceProviderId: string) {
    return this.s3Service.getS3Config();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCognitoConfig(serviceProviderId: string) {
    return this.cognitoService.getCognitoIdentityConfig();
  }

  async getCognitoCredentials(serviceProviderId: string) {
    const cognitoCredentials = await this.cognitoService.getOpenIdTokenForDeveloperIdentity(serviceProviderId);

    if (!cognitoCredentials) {
      throw new InternalServerErrorException(
        new CustomError({
          localizedMessage: {
            en: 'Failed to fetch Cognito credentials',
            ar: 'فشل في جلب بيانات الاعتماد من Cognito',
          },
          event: 'COGNITO_CREDENTIALS_FAILED',
        }),
      );
    }

    return cognitoCredentials;
  }

  async switchBranchAccess(serviceProviderId: string | Types.ObjectId, { branchId, brandId }: SwitchBranchAccessDto) {
    const brandMembership = await this.brandMembershipModel.findOne({
      brand: new Types.ObjectId(brandId),
      serviceProvider: new Types.ObjectId(serviceProviderId),
    });

    if (!brandMembership) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'You are not authorized to access this resource',
            ar: 'ليس لديك صلاحية الوصول إلى هذا المورد',
          },
          event: 'BRANCH_ACCESS_CONTROL',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const branchAccessControl = await this.branchAccessControlModel.findOne({
      branch: new Types.ObjectId(branchId),
      brand: new Types.ObjectId(brandId),
      serviceProvider: new Types.ObjectId(serviceProviderId),
    });

    if (!branchAccessControl) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'You are not authorized to access this resource',
            ar: 'ليس لديك صلاحية الوصول إلى هذا المورد',
          },
          event: 'BRANCH_ACCESS_CONTROL',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    brandMembership.defaultBranchAccessControl = {
      branch: new Types.ObjectId(branchId),
      permissions: branchAccessControl.permissions,
      role: {
        _id: branchAccessControl.role._id,
        name: branchAccessControl.role.name,
        level: branchAccessControl.role.level,
      },
      status: ServiceProviderStatusEnum.ACTIVE,
    };
    await brandMembership.save();

    branchAccessControl.isDefault = true;
    await branchAccessControl.save();

    await this.branchAccessControlModel.updateMany(
      {
        brand: new Types.ObjectId(brandId),
        serviceProvider: new Types.ObjectId(serviceProviderId),
        _id: { $ne: new Types.ObjectId(branchId) },
      },
      { $set: { isDefault: false } },
    );

    return await this.handleServiceProviderLoginAndGenerateTokens(serviceProviderId);
  }

  private generateTempAccessToken(serviceProviderId: string) {
    const payload: ITempAccessTokenPayload = {
      _id: serviceProviderId,
      temp: true,
    };

    return this.jwtService.sign(payload, {
      secret: this.appConfig.CLINIC_JWT_SECRET,
      expiresIn: '10m',
    });
  }

  private async setRedisAttempts(email: string, attempts: number, key: string) {
    await this.redis.set(`${email}-${key}`, (Number(attempts) || 0) + 1, 'EX', 3600); // 1 hour
  }
  private validateTempAccessToken(accessToken: string) {
    const payload = this.jwtService.verify(accessToken, {
      secret: this.appConfig.CLINIC_JWT_SECRET,
    });

    if (!payload?.temp) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid access token',
            ar: 'رمز الوصول غير صالح',
          },
          event: 'INVALID_ACCESS_TOKEN',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    return payload;
  }
}
