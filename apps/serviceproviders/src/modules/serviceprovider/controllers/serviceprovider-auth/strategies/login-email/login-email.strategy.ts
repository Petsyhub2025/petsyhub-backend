import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { CustomError, ErrorType, IServiceProviderModel, ModelNames } from '@instapets-backend/common';
import { Strategy } from 'passport-local';
import { LoginEmailStrategyService } from './login-email-strategy.service';
import { LoginEmailDto } from '@serviceproviders/serviceprovider/controllers/serviceprovider-auth/dto/login-email.dto';

@Injectable()
export class LoginEmailStrategy extends PassportStrategy(Strategy, 'serviceprovider-login-email') {
  constructor(
    @Inject(ModelNames.SERVICE_PROVIDER) private serviceProviderModel: IServiceProviderModel,
    private readonly loginEmailStrategyService: LoginEmailStrategyService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    const payload: LoginEmailDto = {
      email,
      password,
    };

    const serviceProvider = await this.serviceProviderModel.findOne(
      { email },
      {
        email: 1,
        password: 1,
        name: 1,
        phoneNumber: 1,
        fullName: 1,
      },
    );

    if (!serviceProvider) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect email or password',
            ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const loggedInServiceProvider = await this.loginEmailStrategyService.loginServiceProvider(payload, serviceProvider);

    return loggedInServiceProvider;
  }
}
