import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import {
  AppConfig,
  CustomError,
  ErrorType,
  ICustomerInstanceMethods,
  ICustomerModel,
  ModelNames,
  Customer,
  User,
  IUserInstanceMethods,
  CustomerEventsEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';
import { LoginEmailDto } from '@customers/customer/controllers/customer-auth/dto/login-email.dto';
import { BaseAuthService } from '@customers/customer/controllers/customer-auth/base-auth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LoginEmailStrategyService extends BaseAuthService {
  constructor(
    @Inject(ModelNames.CUSTOMER) private _customerModel: ICustomerModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
    private readonly _eventEmitter: EventEmitter2,
  ) {
    super(_customerModel, _appConfig, _jwtService, _redisService, _eventEmitter);
  }

  async loginCustomer(payload: LoginEmailDto, customer: HydratedDocument<Customer, ICustomerInstanceMethods>) {
    const { password } = payload;

    if (!customer.password) {
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

    const isPasswordMatched = await customer.comparePassword(password);

    if (!isPasswordMatched) {
      this._eventEmitter.emit(CustomerEventsEnum.CUSTOMER_LOGIN_FAILURE, customer);
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

    return this.handleCustomerLoginAndGenerateTokens(customer._id);
  }

  async handleMergeCustomerAndSocialAccount(user: HydratedDocument<User, IUserInstanceMethods>, password: string) {
    return this.createCustomerAccountFromRegisteredSocialAccount(user, password);
  }
}
