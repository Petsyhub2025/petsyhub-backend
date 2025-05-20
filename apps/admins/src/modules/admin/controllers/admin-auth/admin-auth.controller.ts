import { Body, Controller, Get, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  CustomResponse,
  IsPrivateAuthOrPublic,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { AdminAuthService } from './admin-auth.service';
import { LoginGoogleDto } from './dto/login-google.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';

@Controller({ path: 'admin-auth', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @IsPrivateAuthOrPublic()
  @NoApiVersion()
  @Post('public/login-google')
  async loginGoogle(@Body() body: LoginGoogleDto) {
    const admin = await this.adminAuthService.loginAdmin(body);

    return new CustomResponse().success({
      payload: { data: admin },
      localizedMessage: {
        en: 'Login successful',
        ar: 'تم تسجيل الدخول بنجاح',
      },
      event: 'ADMIN_GOOGLE_LOGIN_SUCCESS',
    });
  }

  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @NoApiVersion()
  @UseGuards(RefreshTokenGuard)
  @Post('private-auth/refresh-token')
  async refreshToken(@Persona() payload: IRefreshTokenPayload) {
    const admin = await this.adminAuthService.verifyAdminRefreshToken(payload);
    const adminJson = admin.toJSON();

    const { accessToken, refreshToken } = await this.adminAuthService.generateTokens(admin);

    return new CustomResponse().success({
      payload: { data: { ...adminJson, accessToken, refreshToken } },
      localizedMessage: {
        en: 'Token refreshed successfully',
        ar: 'تم تحديث الرقم السري بنجاح',
      },
      event: 'TOKEN_REFRESHED_SUCCESS',
    });
  }

  @ApiBearerAuth()
  @Get('storage/config')
  async getStorageConfig(@Persona() adminJWT: AdminJwtPersona) {
    const config = this.adminAuthService.getStorageConfig(adminJWT._id);

    return new CustomResponse().success({
      payload: { data: config },
    });
  }

  @ApiBearerAuth()
  @Get('cognito/config')
  async getCognitoConfig(@Persona() adminJWT: AdminJwtPersona) {
    const config = this.adminAuthService.getCognitoConfig(adminJWT._id);

    return new CustomResponse().success({
      payload: { data: config },
    });
  }

  @ApiBearerAuth()
  @Get('cognito/credentials')
  async getCognitoCredentials(@Persona() adminJWT: AdminJwtPersona) {
    const credentials = await this.adminAuthService.getCognitoCredentials(adminJWT._id);

    return new CustomResponse().success({
      payload: { data: credentials },
    });
  }
}
