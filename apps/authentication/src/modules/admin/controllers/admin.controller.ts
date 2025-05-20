import { Controller, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '@authentication/admin/guards/admin-jwt.guard';
import { CustomResponse, IsPrivateAuthOrPublic, NoApiVersion } from '@instapets-backend/common';

@Controller({ path: 'admin', version: VERSION_NEUTRAL })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard)
  @Post('authentication')
  authenticateAdmin(): CustomResponse {
    return new CustomResponse().success({
      event: 'ADMIN_AUTHENTICATE_SUCCESS',
      localizedMessage: {
        en: 'Admin authenticated successfully',
        ar: 'تم تأكيد المستخدم بنجاح',
      },
      statusCode: 200,
    });
  }
}
