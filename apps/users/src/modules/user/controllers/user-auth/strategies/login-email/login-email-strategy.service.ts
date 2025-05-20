import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import {
  AppConfig,
  CustomError,
  ErrorType,
  IUserBlockModel,
  IUserInstanceMethods,
  IUserModel,
  IUserTopicModel,
  ModelNames,
  User,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';
import { BaseAuthService } from '@users/user/controllers/user-auth/base-auth.service';
import { LoginEmailDto } from '@users/user/controllers/user-auth/dto/login-email.dto';

@Injectable()
export class LoginEmailStrategyService extends BaseAuthService {
  constructor(
    @Inject(ModelNames.USER) private _userModel: IUserModel,
    @Inject(ModelNames.USER_BLOCK) private _userBlockModel: IUserBlockModel,
    @Inject(ModelNames.USER_TOPIC) private _userTopicModel: IUserTopicModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
  ) {
    super(_userModel, _userBlockModel, _userTopicModel, _appConfig, _jwtService, _redisService);
  }

  async loginUser(payload: LoginEmailDto, user: HydratedDocument<User, IUserInstanceMethods>) {
    const { password } = payload;

    if (!user.password) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'You have not set a password for your account, please login with your social account or reset your password to create a new one',
            ar: 'لم تقم بتعيين كلمة مرور لحسابك ، يرجى تسجيل الدخول باستخدام حسابك الاجتماعي أو إعادة تعيين كلمة المرور لإنشاء كلمة مرور جديدة',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect Email or password',
            ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    return this.handleUserLoginAndGenerateTokens(user._id);
  }
}
