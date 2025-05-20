import { Body, Controller, Get, Param, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BasePaginationQuery, CustomResponse, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { MarkNotificationReadParamsDto } from './dto/mark-notification-read.dto';
import { RegisterFCMTokenDto } from './dto/register-fcm-token.dto';
import { NotificationsService } from './notifications.service';
import { UnregisterFCMTokenDto } from './dto/unregister-fcm-token.dto';

@Controller({ path: 'notifications', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth()
  async getNotifications(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Query() query: BasePaginationQuery,
  ) {
    const notifications = await this.notificationsService.getNotifications(serviceProviderJWT._id, query);

    return new CustomResponse().success({
      payload: notifications,
    });
  }

  @Post('/register-fcm-token')
  @ApiBearerAuth()
  async registerFCMToken(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Body()
    body: RegisterFCMTokenDto,
  ) {
    await this.notificationsService.registerFCMToken(serviceProviderJWT._id, body);

    return new CustomResponse().success({});
  }

  @Post('/unregister-fcm-token')
  @ApiBearerAuth()
  async unregisterFCMToken(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Body()
    body: UnregisterFCMTokenDto,
  ) {
    await this.notificationsService.unregisterFCMToken(serviceProviderJWT._id, body);

    return new CustomResponse().success({});
  }

  @Post('/notification/:notificationId')
  @ApiBearerAuth()
  async markNotificationRead(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Param()
    params: MarkNotificationReadParamsDto,
  ) {
    await this.notificationsService.markNotificationRead(serviceProviderJWT._id, params);

    return new CustomResponse().success({});
  }
}
