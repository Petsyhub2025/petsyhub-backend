import { Body, Controller, Get, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ServiceProviderAuthService } from './serviceprovider-auth.service';
import {
  CustomResponse,
  IsPrivateAuthOrPublic,
  NoApiVersion,
  Persona,
  ServiceProvider,
  ServiceProviderJwtPersona,
} from '@instapets-backend/common';
import { SignupServiceProviderDto } from './dto/signup-serviceprovider.dto';
import { LoginEmailGuard } from './guards/login-email.guard';
import { HydratedDocument } from 'mongoose';
import { LoginEmailDto } from './dto/login-email.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { SwitchBranchAccessDto } from './dto/switch-branch-access.dto';

@Controller({ path: 'auth', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider/auth')
export class ServiceProviderAuthController {
  constructor(private readonly serviceProviderAuthService: ServiceProviderAuthService) {}

  @IsPrivateAuthOrPublic()
  @UseGuards(LoginEmailGuard)
  @Post('public/login-email')
  @NoApiVersion()
  async loginServiceProvider(
    @Persona() serviceProvider: HydratedDocument<ServiceProvider>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() body: LoginEmailDto,
  ) {
    return new CustomResponse().success({
      payload: { data: serviceProvider },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/signup-email')
  @NoApiVersion()
  async signupServiceProvider(@Body() body: SignupServiceProviderDto) {
    const pendingServiceProvider = await this.serviceProviderAuthService.signupServiceProvider(body);

    return new CustomResponse().success({
      payload: { data: pendingServiceProvider },
    });
  }

  @IsPrivateAuthOrPublic()
  @Post('public/verify-signup-email')
  @NoApiVersion()
  async verifyEmail(@Body() body: VerifyEmailDto) {
    await this.serviceProviderAuthService.verifySignupEmail(body);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @Post('public/resend-verification-email')
  @NoApiVersion()
  async resendEmailVerification(@Body() body: ResendVerificationEmailDto) {
    await this.serviceProviderAuthService.resendVerificationEmail(body);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @Post('public/forget-password')
  @NoApiVersion()
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    await this.serviceProviderAuthService.forgetPassword(body);

    return new CustomResponse().success({});
  }

  // @IsPrivateAuthOrPublic()
  // @Post('public/verify-forget-password-email')
  // async verifyForgetPasswordEmail(@Body() body: VerifyEmailDto) {
  //   const accessToken = await this.serviceProviderAuthService.verifyForgetPasswordEmail(body);

  //   return new CustomResponse().success({
  //     payload: { data: { accessToken } },
  //   });
  // }

  @IsPrivateAuthOrPublic()
  @Post('private-auth/reset-password')
  @NoApiVersion()
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.serviceProviderAuthService.resetPassword(body);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @UseGuards(RefreshTokenGuard)
  @Post('private-auth/refresh-token')
  @NoApiVersion()
  async refreshToken(@Persona() payload: IRefreshTokenPayload) {
    const serviceProvider = await this.serviceProviderAuthService.refreshTokens(payload);

    return new CustomResponse().success({
      payload: { data: serviceProvider },
      localizedMessage: {
        en: 'Token refreshed successfully',
        ar: 'تم تحديث الرقم السري بنجاح',
      },
      event: 'TOKEN_REFRESHED_SUCCESS',
    });
  }

  @ApiBearerAuth()
  @Post('private-auth/switch-branch-access')
  @NoApiVersion()
  async switchBranchAccess(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Body() body: SwitchBranchAccessDto,
  ) {
    const serviceProvider = await this.serviceProviderAuthService.switchBranchAccess(
      serviceProviderJwtPersona._id,
      body,
    );

    return new CustomResponse().success({
      payload: { data: serviceProvider },
    });
  }

  @ApiBearerAuth()
  @Get('storage/config')
  @NoApiVersion()
  async getStorageConfig(@Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona) {
    const config = this.serviceProviderAuthService.getStorageConfig(serviceProviderJwtPersona._id);

    return new CustomResponse().success({
      payload: { data: config },
    });
  }

  @ApiBearerAuth()
  @Get('cognito/config')
  @NoApiVersion()
  async getCognitoConfig(@Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona) {
    const config = this.serviceProviderAuthService.getCognitoConfig(serviceProviderJwtPersona._id);

    return new CustomResponse().success({
      payload: { data: config },
    });
  }

  @ApiBearerAuth()
  @Get('cognito/credentials')
  @NoApiVersion()
  async getCognitoCredentials(@Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona) {
    const credentials = await this.serviceProviderAuthService.getCognitoCredentials(serviceProviderJwtPersona._id);

    return new CustomResponse().success({
      payload: { data: credentials },
    });
  }
}
