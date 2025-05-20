import { Body, Controller, Get, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Persona, BasePaginationQuery, CustomResponse, AdminJwtPersona } from '@instapets-backend/common';
import { NotificationsService } from './notifications.service';
import { RegisterFCMTokenDto } from './dto/register-fcm-token.dto';
import { UnregisterFCMTokenDto } from './dto/unregister-fcm-token.dto';

@Controller({ path: 'notifications', version: VERSION_NEUTRAL })
@ApiTags('admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth()
  async getNotifications(@Persona() adminJWT: AdminJwtPersona, @Query() query: BasePaginationQuery) {
    const notifications = await this.notificationsService.getNotifications(adminJWT._id, query);

    return new CustomResponse().success({
      payload: notifications,
    });
  }

  @Post('/register-fcm-token')
  @ApiBearerAuth()
  async registerFCMToken(
    @Persona() adminJWT: AdminJwtPersona,
    @Body()
    body: RegisterFCMTokenDto,
  ) {
    await this.notificationsService.registerFCMToken(adminJWT._id, body);

    return new CustomResponse().success({});
  }

  @Post('/unregister-fcm-token')
  @ApiBearerAuth()
  async unregisterFCMToken(
    @Persona() adminJWT: AdminJwtPersona,
    @Body()
    body: UnregisterFCMTokenDto,
  ) {
    await this.notificationsService.unregisterFCMToken(adminJWT._id, body);

    return new CustomResponse().success({});
  }
}
