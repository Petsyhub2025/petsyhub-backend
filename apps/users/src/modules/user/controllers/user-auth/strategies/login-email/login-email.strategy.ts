import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { CustomError, ErrorType, IUserModel, ModelNames } from '@instapets-backend/common';
import { Strategy } from 'passport-local';
import { LoginEmailDto } from '../../dto/login-email.dto';
import { LoginEmailStrategyService } from './login-email-strategy.service';

@Injectable()
export class LoginEmailStrategy extends PassportStrategy(Strategy, 'user-login-email') {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
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

    const user = await this.userModel.findOne({ email });

    if (!user) {
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

    const loggedInUser = await this.loginEmailStrategyService.loginUser(payload, user);

    return loggedInUser;
  }
}
