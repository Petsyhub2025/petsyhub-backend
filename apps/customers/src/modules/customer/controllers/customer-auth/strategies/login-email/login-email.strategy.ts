import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { CustomError, ErrorType, ICustomerModel, IUserModel, ModelNames } from '@instapets-backend/common';
import { Strategy } from 'passport-local';
import { LoginEmailStrategyService } from './login-email-strategy.service';
import { LoginEmailDto } from '@customers/customer/controllers/customer-auth/dto/login-email.dto';

@Injectable()
export class LoginEmailStrategy extends PassportStrategy(Strategy, 'customer-login-email') {
  constructor(
    @Inject(ModelNames.CUSTOMER) private customerModel: ICustomerModel,
    private readonly loginEmailStrategyService: LoginEmailStrategyService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
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

    // eslint-disable-next-line prefer-const
    let [customer, socialUser] = await Promise.all([
      this.customerModel.findOne({ email }),
      this.userModel.findOne({ email }),
    ]);
    if (!customer && !socialUser) {
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

    if (!customer && socialUser) {
      customer = await this.loginEmailStrategyService.handleMergeCustomerAndSocialAccount(socialUser, password);
    }

    const loggedInCustomer = await this.loginEmailStrategyService.loginCustomer(payload, customer);

    return loggedInCustomer;
  }
}
