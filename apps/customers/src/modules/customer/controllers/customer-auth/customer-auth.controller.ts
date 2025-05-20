import { CustomResponse, IsPrivateAuthOrPublic, Persona, Customer } from '@instapets-backend/common';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@customers/shared/constants';
import { HydratedDocument } from 'mongoose';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginGoogleOrAppleDto } from './dto/login-google-apple.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginEmailGuard } from './guards/login-email.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';
import { CustomerAuthService } from './customer-auth.service';

@Controller({
  path: 'auth',
  ...globalControllerVersioning,
})
@ApiTags('customer/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @UseGuards(RefreshTokenGuard)
  @Post('private-auth/refresh-token')
  async refreshToken(@Persona() payload: IRefreshTokenPayload) {
    const customer = await this.customerAuthService.refreshCustomerTokens(payload);

    return new CustomResponse().success({
      payload: { data: customer },
      localizedMessage: {
        en: 'Token refreshed successfully',
        ar: 'تم تحديث الرقم السري بنجاح',
      },
      event: 'TOKEN_REFRESHED_SUCCESS',
    });
  }

  @IsPrivateAuthOrPublic()
  @UseGuards(LoginEmailGuard)
  @Post('public/login-email')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async loginCustomer(@Persona() customer: HydratedDocument<Customer>, @Body() body: LoginEmailDto) {
    return new CustomResponse().success({
      payload: { data: customer },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/sso/google/login')
  async loginGoogle(@Body() body: LoginGoogleOrAppleDto) {
    const customer = await this.customerAuthService.loginGoogle(body);

    return new CustomResponse().success({
      payload: { data: customer },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/sso/apple/login')
  async loginApple(@Body() body: LoginGoogleOrAppleDto) {
    const customer = await this.customerAuthService.loginApple(body);

    return new CustomResponse().success({
      payload: { data: customer },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/signup-email')
  async signupCustomer(@Body() body: SignupCustomerDto) {
    const pendingCustomer = await this.customerAuthService.signupCustomer(body);

    return new CustomResponse().success({
      payload: { data: pendingCustomer },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/verify-signup-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    const customer = await this.customerAuthService.verifySignupEmailVerificationCode(body);

    return new CustomResponse().success({
      payload: { data: customer },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/forget-password')
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    await this.customerAuthService.forgetPassword(body);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @Post('public/verify-forget-password-email')
  async verifyForgetPasswordEmail(@Body() body: VerifyEmailDto) {
    const accessToken = await this.customerAuthService.verifyForgetPasswordEmail(body);

    return new CustomResponse().success({
      payload: { data: { accessToken } },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('private-auth/reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.customerAuthService.resetPassword(body);

    return new CustomResponse().success({});
  }
}
