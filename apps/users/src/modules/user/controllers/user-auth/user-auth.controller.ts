import { CustomResponse, IsPrivateAuthOrPublic, Persona, User, UserJwtPersona } from '@instapets-backend/common';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@users/shared/constants';
import { HydratedDocument } from 'mongoose';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginGoogleOrAppleDto } from './dto/login-google-apple.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupUserDto } from './dto/signup-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginEmailGuard } from './guards/login-email.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';
import { UserAuthService } from './user-auth.service';

@Controller({
  path: 'auth',
  ...globalControllerVersioning,
})
@ApiTags('user/auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @UseGuards(RefreshTokenGuard)
  @Post('private-auth/refresh-token')
  async refreshToken(@Persona() payload: IRefreshTokenPayload) {
    const user = await this.userAuthService.refreshUserTokens(payload);

    return new CustomResponse().success({
      payload: { data: user },
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
  async loginUser(@Persona() user: HydratedDocument<User>, @Body() body: LoginEmailDto) {
    return new CustomResponse().success({
      payload: { data: user },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/sso/google/login')
  async loginGoogle(@Body() body: LoginGoogleOrAppleDto) {
    const user = await this.userAuthService.loginGoogle(body);

    return new CustomResponse().success({
      payload: { data: user },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/sso/apple/login')
  async loginApple(@Body() body: LoginGoogleOrAppleDto) {
    const user = await this.userAuthService.loginApple(body);

    return new CustomResponse().success({
      payload: { data: user },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/signup-email')
  async signupUser(@Body() body: SignupUserDto) {
    const pendingUser = await this.userAuthService.signupUser(body);

    return new CustomResponse().success({
      payload: { data: pendingUser },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/verify-signup-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    const user = await this.userAuthService.verifySignupEmailVerificationCode(body);

    return new CustomResponse().success({
      payload: { data: user },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/forget-password')
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    await this.userAuthService.forgetPassword(body);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @Post('public/verify-forget-password-email')
  async verifyForgetPasswordEmail(@Body() body: VerifyEmailDto) {
    const accessToken = await this.userAuthService.verifyForgetPasswordEmail(body);

    return new CustomResponse().success({
      payload: { data: { accessToken } },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('private-auth/reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.userAuthService.resetPassword(body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get('storage/config')
  async getStorageConfig(@Persona() userJWT: UserJwtPersona) {
    const config = this.userAuthService.getStorageConfig(userJWT._id);

    return new CustomResponse().success({
      payload: { data: config },
    });
  }

  @ApiBearerAuth()
  @Get('cognito/config')
  async getCognitoConfig(@Persona() userJWT: UserJwtPersona) {
    const config = this.userAuthService.getCognitoConfig(userJWT._id);

    return new CustomResponse().success({
      payload: { data: config },
    });
  }

  @ApiBearerAuth()
  @Get('cognito/credentials')
  async getCognitoCredentials(@Persona() userJWT: UserJwtPersona) {
    const credentials = await this.userAuthService.getCognitoCredentials(userJWT._id);

    return new CustomResponse().success({
      payload: { data: credentials },
    });
  }
}
