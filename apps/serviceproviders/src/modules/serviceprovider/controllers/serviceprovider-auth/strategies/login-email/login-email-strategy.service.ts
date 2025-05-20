import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import {
  AppConfig,
  CustomError,
  ErrorType,
  IServiceProviderInstanceMethods,
  IServiceProviderModel,
  ModelNames,
  ServiceProvider,
  ServiceProviderEventsEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';
import { BaseAuthService } from '@serviceproviders/serviceprovider/controllers/serviceprovider-auth/base-auth.service';
import { LoginEmailDto } from '@serviceproviders/serviceprovider/controllers/serviceprovider-auth/dto/login-email.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LoginEmailStrategyService extends BaseAuthService {
  constructor(
    @Inject(ModelNames.SERVICE_PROVIDER)
    private _serviceProviderModel: IServiceProviderModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
    private readonly _eventEmitter: EventEmitter2,
  ) {
    super(_serviceProviderModel, _appConfig, _jwtService, _redisService, _eventEmitter);
  }

  async loginServiceProvider(
    payload: LoginEmailDto,
    serviceProvider: HydratedDocument<ServiceProvider, IServiceProviderInstanceMethods>,
  ) {
    const { password, rememberMe } = payload;

    const isPasswordMatched = await serviceProvider.comparePassword(password);

    if (!isPasswordMatched) {
      this._eventEmitter.emit(ServiceProviderEventsEnum.SERVICE_PROVIDER_LOGIN_FAILURE, serviceProvider);
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

    return await this.handleServiceProviderLoginAndGenerateTokens(serviceProvider._id, rememberMe);
  }
}
