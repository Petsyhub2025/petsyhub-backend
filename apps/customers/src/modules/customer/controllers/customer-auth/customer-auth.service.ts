import {
  AppConfig,
  AwsSESService,
  CustomError,
  CustomLoggerService,
  ErrorType,
  IPendingCustomerModel,
  ICustomerModel,
  ModelNames,
  PendingCustomer,
  Customer,
  IUserModel,
  StripeService,
  CustomerEventsEnum,
} from '@instapets-backend/common';
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import { errorManager } from '@customers/customer/shared/config/errors.config';
import { isEmail } from 'class-validator';
import { LoginTicket, OAuth2Client } from 'google-auth-library';
import jwks from 'jwks-rsa';
import { HydratedDocument } from 'mongoose';
import { BaseAuthService } from './base-auth.service';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LoginGoogleOrAppleDto } from './dto/login-google-apple.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { IAppleJWTPayload, JwtHeaderWithKid } from './interfaces/signin-with-apple.interface';
import { ITempAccessTokenPayload } from './interfaces/temp-access-token.interface';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';
import { TemplateManagerService } from '@instapets-backend/common';
import bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CustomerAuthService extends BaseAuthService {
  private APPLE_AUTH_KEYS_URL = 'https://appleid.apple.com/auth/keys';
  private APPLE_ISSUER = 'https://appleid.apple.com';

  constructor(
    @Inject(ModelNames.CUSTOMER) private _customerModel: ICustomerModel,
    @Inject(ModelNames.PENDING_CUSTOMER) private pendingCustomerModel: IPendingCustomerModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
    private readonly sesService: AwsSESService,
    private readonly logger: CustomLoggerService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    private readonly stripeService: StripeService,
    private readonly templateService: TemplateManagerService,
    private readonly _eventEmitter: EventEmitter2,
  ) {
    super(_customerModel, _appConfig, _jwtService, _redisService, _eventEmitter);
  }

  async signupCustomer({ email, password, firstName, lastName, phoneNumber }: SignupCustomerDto) {
    const [customerAccountAlreadyExist, socialUserAccountAlreadyExist] = await Promise.all([
      this.customerModel.findOne({ email }),
      this.userModel.findOne({ email }),
    ]);

    if (customerAccountAlreadyExist) {
      throw new UnauthorizedException(errorManager.EMAIL_ALREADY_EXISTS);
    }

    if (socialUserAccountAlreadyExist) {
      throw new UnauthorizedException(errorManager.USER_SOCIAL_EMAIL_ALREADY_EXISTS);
    }

    const attempts = await this.redis.get(`${email}-trials`);

    if (Number(attempts) >= 3) {
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

    let pendingCustomer: HydratedDocument<PendingCustomer> = await this.pendingCustomerModel.findOne({ email });

    pendingCustomer = pendingCustomer || new this.pendingCustomerModel();

    pendingCustomer.set({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    const savedPendingCustomer = (await pendingCustomer.save()).toJSON();

    delete savedPendingCustomer.password;

    const code = await this.generateEmailVerificationCode(email, attempts);

    const template = this.templateService.getOtpEmail(savedPendingCustomer.firstName, code);

    await this.sesService.sendEmail(
      {
        emails: email,
        subject: 'PetsyHub Email Verification Code',
        template: template,
      },
      'PetsyHub',
    );

    return savedPendingCustomer;
  }

  async loginGoogle(body: LoginGoogleOrAppleDto) {
    const { idToken } = body;
    const {
      email: googleEmail,
      sub: googleId,
      given_name,
      family_name,
      picture,
    } = await this.verifyGoogleIdToken(idToken);

    const isGoogleEmailValid = isEmail(googleEmail);

    if (!isGoogleEmailValid) {
      throw new UnauthorizedException(errorManager.EMAIL_ACCESS_REQUIRED);
    }

    let existingCustomer = await this.customerModel.findOne({ googleId });

    if (!existingCustomer && isGoogleEmailValid) {
      existingCustomer = await this.customerModel.findOne({ email: googleEmail });
    }

    const firstName = existingCustomer?.firstName || given_name;
    const lastName = existingCustomer?.lastName || family_name;

    const customer = existingCustomer || new this.customerModel();
    const email = customer.email || googleEmail;

    let stripeCustomer;
    if (!customer.stripeCustomerId) {
      stripeCustomer = await this.stripeService.client.customers.create({
        email: customer.email,
        //first and last name and full name are optional
        name: `${
          customer.firstName && customer.lastName ? customer.firstName + ' ' + customer.lastName : customer.email
        }`,
      });
    }
    customer.set({
      ...(stripeCustomer ? { stripeCustomerId: stripeCustomer.id } : {}),
      firstName,
      lastName,
      email,
      googleId,
    } as Customer);

    if (!existingCustomer && picture) {
      customer.set({ profilePicture: picture });
    }

    const savedCustomer = await customer.save();

    return this.handleCustomerLoginAndGenerateTokens(savedCustomer._id);
  }

  async loginApple(body: LoginGoogleOrAppleDto) {
    const { idToken } = body;
    const { email: appleEmail, sub: appleId } = await this.verifyAppleIdToken(idToken);

    const isAppleEmailValid = isEmail(appleEmail);

    if (!isAppleEmailValid) {
      throw new UnauthorizedException(errorManager.EMAIL_ACCESS_REQUIRED);
    }

    let existingCustomer = await this.customerModel.findOne({ appleId });

    if (!existingCustomer && isAppleEmailValid) {
      existingCustomer = await this.customerModel.findOne({ email: appleEmail });
    }

    const firstName = existingCustomer?.firstName;
    const lastName = existingCustomer?.lastName;

    const customer = existingCustomer || new this.customerModel();
    const email = customer.email || (isAppleEmailValid ? appleEmail : undefined);

    let stripeCustomer;
    if (!customer.stripeCustomerId) {
      stripeCustomer = await this.stripeService.client.customers.create({
        email: customer.email,
        //first and last name and full name are optional
        name: `${
          customer.firstName && customer.lastName ? customer.firstName + ' ' + customer.lastName : customer.email
        }`,
      });
    }
    customer.set({
      ...(stripeCustomer ? { stripeCustomerId: stripeCustomer.id } : {}),
      firstName,
      lastName,
      email,
      appleId,
    } as Customer);

    const savedCustomer = await customer.save();

    return this.handleCustomerLoginAndGenerateTokens(savedCustomer._id);
  }

  async verifySignupEmailVerificationCode({ email, code }: VerifyEmailDto) {
    const pendingCustomer = await this.pendingCustomerModel.findOne({ email });

    if (!pendingCustomer) {
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

    await this.validateEmailVerificationCode({ email, code });

    let newCustomer = await this.customerModel.findOne({ email });
    newCustomer = newCustomer || new this.customerModel();

    let customer;
    if (!newCustomer.stripeCustomerId) {
      customer = await this.stripeService.client.customers.create({
        email: pendingCustomer.email,
        //first and last name and full name are optional
        name: `${
          pendingCustomer.firstName && pendingCustomer.lastName
            ? pendingCustomer.firstName + ' ' + pendingCustomer.lastName
            : pendingCustomer.email
        }`,
      });
    }

    newCustomer.set({
      ...(customer ? { stripeCustomerId: customer.id } : {}),
      email: pendingCustomer.email,
      password: pendingCustomer.password,
      firstName: pendingCustomer.firstName,
      lastName: pendingCustomer.lastName,
      phoneNumber: pendingCustomer.phoneNumber,
    });

    newCustomer.unmarkModified('password');

    await newCustomer.save();
    await pendingCustomer.deleteOne();

    const verifiedCustomerData = await this.handleCustomerLoginAndGenerateTokens(newCustomer._id);

    this._eventEmitter.emit(CustomerEventsEnum.CUSTOMER_REGISTERED, newCustomer);

    return {
      ...verifiedCustomerData,
    };
  }

  async refreshCustomerTokens(payload: IRefreshTokenPayload) {
    const { _id: customerId, sessionId } = payload;

    // Delete current session from redis
    const removeResult = await this.redis.lrem(customerId, 0, sessionId);

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

    return this.handleCustomerLoginAndGenerateTokens(customerId, 'refresh');
  }

  async forgetPassword({ email }: ForgetPasswordDto) {
    const customer = await this.customerModel.findOne({ email });

    if (!customer) return;

    const attempts = await this.redis.get(`${email}-trials`);

    if (Number(attempts) >= 3) {
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

    const code = await this.generateEmailVerificationCode(email, attempts);

    const template = this.templateService.getForgotPasswordEmail(customer.firstName, code);

    await this.sesService.sendEmail(
      {
        emails: email,
        subject: 'PetsyHub Email Verification',
        template: template,
      },
      'PetsyHub',
    );
  }

  async verifyForgetPasswordEmail({ code, email }: VerifyEmailDto) {
    const storedCode = await this.redis.get(`${email}-verify`);

    if (!storedCode) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid email',
            ar: 'البريد الإلكتروني غير صحيح',
          },
          event: 'INVALID_EMAIL',
          errorType: ErrorType.WRONG_REQUEST,
        }),
      );
    }

    const customer = await this.customerModel.findOne({ email });

    if (!customer) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid email',
            ar: 'البريد الإلكتروني غير صحيح',
          },
          event: 'INVALID_EMAIL',
          errorType: ErrorType.WRONG_REQUEST,
        }),
      );
    }

    await this.validateEmailVerificationCode({ email, code });

    return this.generateTempAccessToken(customer._id?.toString());
  }

  async resetPassword({ accessToken, newPassword }: ResetPasswordDto) {
    const { _id }: ITempAccessTokenPayload = this.validateTempAccessToken(accessToken);

    const customer = await this.customerModel.findById(_id);

    if (!customer) {
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
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    customer.password = hashedPassword;

    await customer.save();

    this._eventEmitter.emit(CustomerEventsEnum.CUSTOMER_PASSWORD_CHANGED, customer);
  }

  private generateTempAccessToken(customerId: string) {
    const payload: ITempAccessTokenPayload = {
      _id: customerId,
      temp: true,
    };

    return this.jwtService.sign(payload, {
      secret: this.appConfig.CUSTOMER_JWT_SECRET,
      expiresIn: '10m',
    });
  }

  private validateTempAccessToken(accessToken: string) {
    const payload = this.jwtService.verify(accessToken, {
      secret: this.appConfig.CUSTOMER_JWT_SECRET,
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

  private async generateEmailVerificationCode(email: string, attempts?: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await Promise.all([
      this.redis.set(`${email}-trials`, (Number(attempts) || 0) + 1, 'EX', 3600), // 1 hour
      this.redis.set(`${email}-verify`, code, 'EX', 600), // 10 minutes
    ]);

    return code;
  }

  private async validateEmailVerificationCode({ email, code }: VerifyEmailDto) {
    const storedCode = await this.redis.get(`${email}-verify`);

    if (storedCode !== code) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect code',
            ar: 'الرمز غير صحيح',
          },
          event: 'INCORRECT_CODE',
          errorType: ErrorType.WRONG_REQUEST,
        }),
      );
    }

    await Promise.all([this.redis.del(`${email}-verify`), this.redis.del(`${email}-trials`)]);
  }

  private async verifyGoogleIdToken(idToken: string) {
    const client = new OAuth2Client(this.appConfig.CUSTOMER_GOOGLE_CLIENT_ID);

    try {
      const loginTicket: LoginTicket = await client.verifyIdToken({
        idToken,
        audience: this.appConfig.CUSTOMER_GOOGLE_CLIENT_ID,
      });

      return loginTicket.getPayload();
    } catch (error) {
      this.logger.error('Failed to verify google login token', { error });
      throw new UnauthorizedException(errorManager.GOOGLE_ACCOUNT_LINK_FAILED);
    }
  }

  private async verifyAppleIdToken(idToken: string): Promise<IAppleJWTPayload> {
    const decodedToken = this.jwtService.decode(idToken, { complete: true }) as {
      header: JwtHeaderWithKid;
      payload: IAppleJWTPayload;
    };
    ``;

    if (!decodedToken) {
      this.logger.error('Failed to decode apple id token', { idToken, decodedToken });
      throw new UnauthorizedException(errorManager.APPLE_ACCOUNT_LINK_FAILED);
    }

    const tokenHeaderKid = decodedToken.header?.kid;
    const signingKey = await this.getAppleSigningKey(tokenHeaderKid);
    const publicKey = signingKey.getPublicKey();

    try {
      this.jwtService.verify(idToken, {
        algorithms: ['RS256'],
        publicKey,
        audience: this.appConfig.CUSTOMER_APPLE_CLIENT_ID,
        issuer: this.APPLE_ISSUER,
      });

      return decodedToken.payload;
    } catch (error) {
      this.logger.error('Failed to verify apple id token', { error });
      throw new UnauthorizedException(errorManager.APPLE_ACCOUNT_LINK_FAILED);
    }
  }

  private async getAppleSigningKey(kid: string): Promise<jwks.SigningKey> {
    try {
      const jwksClient = jwks({
        jwksUri: this.APPLE_AUTH_KEYS_URL,
      });

      const key = await jwksClient.getSigningKey(kid);

      return key;
    } catch (error) {
      this.logger.error('Failed to fetch apple auth keys', { error });
      throw new UnauthorizedException(errorManager.APPLE_ACCOUNT_LINK_FAILED);
    }
  }
}
