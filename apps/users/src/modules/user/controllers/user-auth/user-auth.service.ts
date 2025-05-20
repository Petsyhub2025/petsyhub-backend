import {
  AppConfig,
  AwsCognitoService,
  AwsS3Service,
  AwsSESService,
  CustomError,
  CustomLoggerService,
  ErrorType,
  IPendingUserModel,
  IUserBlockModel,
  IUserModel,
  IUserTopicModel,
  ModelNames,
  PendingUser,
  User,
} from '@instapets-backend/common';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import { errorManager } from '@users/user/shared/config/errors.config';
import { isEmail } from 'class-validator';
import { LoginTicket, OAuth2Client } from 'google-auth-library';
import jwks from 'jwks-rsa';
import { HydratedDocument } from 'mongoose';
import { BaseAuthService } from './base-auth.service';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LoginGoogleOrAppleDto } from './dto/login-google-apple.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupUserDto } from './dto/signup-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { IAppleJWTPayload, JwtHeaderWithKid } from './interfaces/signin-with-apple.interface';
import { ITempAccessTokenPayload } from './interfaces/temp-access-token.interface';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';
import { TemplateManagerService } from '@instapets-backend/common';

@Injectable()
export class UserAuthService extends BaseAuthService {
  private APPLE_AUTH_KEYS_URL = 'https://appleid.apple.com/auth/keys';
  private APPLE_ISSUER = 'https://appleid.apple.com';

  constructor(
    @Inject(ModelNames.USER) private _userModel: IUserModel,
    @Inject(ModelNames.USER_BLOCK) private _userBlockModel: IUserBlockModel,
    @Inject(ModelNames.USER_TOPIC) private _userTopicModel: IUserTopicModel,
    @Inject(ModelNames.PENDING_USER) private pendingUserModel: IPendingUserModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
    private readonly sesService: AwsSESService,
    private readonly logger: CustomLoggerService,
    private readonly cognitoService: AwsCognitoService,
    private readonly s3Service: AwsS3Service,
    private readonly templateService: TemplateManagerService,
  ) {
    super(_userModel, _userBlockModel, _userTopicModel, _appConfig, _jwtService, _redisService);
  }

  async signupUser({ email, password }: SignupUserDto) {
    const user = await this.userModel.findOne({ email });

    if (user) {
      throw new UnauthorizedException(errorManager.EMAIL_ALREADY_EXISTS);
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

    let pendingUser: HydratedDocument<PendingUser> = await this.pendingUserModel.findOne({ email });

    pendingUser = pendingUser || new this.pendingUserModel();

    pendingUser.set({
      email,
      password,
    });

    const savedPendingUser = (await pendingUser.save()).toJSON();

    delete savedPendingUser.password;

    const code = await this.generateEmailVerificationCode(email, attempts);

    const template = this.templateService.getOtpEmail(savedPendingUser.firstName, code);

    await this.sesService.sendEmail({
      emails: email,
      subject: 'Petsy Email Verification',
      template,
    });

    return savedPendingUser;
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

    let existingUser = await this.userModel.findOne({ googleId });

    if (!existingUser && isGoogleEmailValid) {
      existingUser = await this.userModel.findOne({ email: googleEmail });
    }

    const firstName = existingUser?.firstName || given_name;
    const lastName = existingUser?.lastName || family_name;

    const user = existingUser || new this.userModel();
    const email = user.email || googleEmail;

    user.set({
      firstName,
      lastName,
      email,
      googleId,
    } as User);

    if (!existingUser && picture) {
      user.set({ profilePicture: picture });
    }

    const savedUser = await user.save();

    return this.handleUserLoginAndGenerateTokens(savedUser._id);
  }

  async loginApple(body: LoginGoogleOrAppleDto) {
    const { idToken } = body;
    const { email: appleEmail, sub: appleId } = await this.verifyAppleIdToken(idToken);

    const isAppleEmailValid = isEmail(appleEmail);

    if (!isAppleEmailValid) {
      throw new UnauthorizedException(errorManager.EMAIL_ACCESS_REQUIRED);
    }

    let existingUser = await this.userModel.findOne({ appleId });

    if (!existingUser && isAppleEmailValid) {
      existingUser = await this.userModel.findOne({ email: appleEmail });
    }

    const firstName = existingUser?.firstName;
    const lastName = existingUser?.lastName;

    const user = existingUser || new this.userModel();
    const email = user.email || (isAppleEmailValid ? appleEmail : undefined);

    user.set({
      firstName,
      lastName,
      email,
      appleId,
    } as User);

    const savedUser = await user.save();

    return this.handleUserLoginAndGenerateTokens(savedUser._id);
  }

  async verifySignupEmailVerificationCode({ email, code }: VerifyEmailDto) {
    const pendingUser = await this.pendingUserModel.findOne({ email });

    if (!pendingUser) {
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

    let newUser = await this.userModel.findOne({ email });
    newUser = newUser || new this.userModel();

    newUser.set({
      email: pendingUser.email,
      password: pendingUser.password,
    });

    newUser.unmarkModified('password');

    await newUser.save();
    await pendingUser.deleteOne();

    const verifiedUserData = await this.handleUserLoginAndGenerateTokens(newUser._id);

    return {
      ...verifiedUserData,
      firstName: '',
      lastName: '',
    };
  }

  async refreshUserTokens(payload: IRefreshTokenPayload) {
    const { _id: userId, sessionId } = payload;

    // Delete current session from redis
    const removeResult = await this.redis.lrem(userId, 0, sessionId);

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

    return this.handleUserLoginAndGenerateTokens(userId);
  }

  async forgetPassword({ email }: ForgetPasswordDto) {
    const user = await this.userModel.findOne({ email });

    if (!user) return;

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

    const template = this.templateService.getForgotPasswordEmail(user.firstName, code);

    await this.sesService.sendEmail({
      emails: email,
      subject: 'Petsy Email Verification',
      template,
    });
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

    const user = await this.userModel.findOne({ email });

    if (!user) {
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

    return this.generateTempAccessToken(user._id?.toString());
  }

  async resetPassword({ accessToken, newPassword }: ResetPasswordDto) {
    const { _id }: ITempAccessTokenPayload = this.validateTempAccessToken(accessToken);

    const user = await this.userModel.findById(_id);

    if (!user) {
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

    user.password = newPassword;

    await user.save();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStorageConfig(userId: string) {
    return this.s3Service.getS3Config();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCognitoConfig(userId: string) {
    return this.cognitoService.getCognitoIdentityConfig();
  }

  async getCognitoCredentials(userId: string) {
    const cognitoCredentials = await this.cognitoService.getOpenIdTokenForDeveloperIdentity(String(userId));

    if (!cognitoCredentials) {
      throw new InternalServerErrorException(errorManager.COGNITO_CREDENTIALS_FAILED);
    }

    return cognitoCredentials;
  }

  private generateTempAccessToken(userId: string) {
    const payload: ITempAccessTokenPayload = {
      _id: userId,
      temp: true,
    };

    return this.jwtService.sign(payload, {
      secret: this.appConfig.USER_JWT_SECRET,
      expiresIn: '10m',
    });
  }

  private validateTempAccessToken(accessToken: string) {
    const payload = this.jwtService.verify(accessToken, {
      secret: this.appConfig.USER_JWT_SECRET,
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
    const client = new OAuth2Client(this.appConfig.USER_GOOGLE_CLIENT_ID);

    try {
      const loginTicket: LoginTicket = await client.verifyIdToken({
        idToken,
        audience: this.appConfig.USER_GOOGLE_CLIENT_ID,
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
        audience: this.appConfig.USER_APPLE_CLIENT_ID,
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
