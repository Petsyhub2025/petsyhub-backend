import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserNotificationsService } from '@notifications/shared-module/services/user-notifications.service';
import {
  BasePaginationQuery,
  CustomResponse,
  IsPrivateAuthOrPublic,
  Persona,
  UserJwtPersona,
  UserNotificationValidationDto,
  VerifyS2SJwtToken,
} from '@instapets-backend/common';
import { MarkNotificationReadParamsDto } from './dto/mark-notification-read.dto';
import { RegisterUserFCMTokenDto } from './dto/register-fcm-token.dto';
import { SendMultiNotificationDto, SendSingleNotificationDto } from './dto/send-notification.dto';
import { UnregisterFCMTokenDto } from './dto/unregister-fcm-token.dto';
import { NotificationsService } from './notifications.service';
import { globalControllerVersioning } from '@notifications/shared-module/constants';

@Controller({ path: 'notifications', ...globalControllerVersioning })
@ApiTags('user/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly userNotificationsService: UserNotificationsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  async getNotifications(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const notifications = await this.notificationsService.getNotifications(userJWT._id, query);

    return new CustomResponse().success({
      payload: notifications,
    });
  }

  @Post('/register-fcm-token')
  @ApiBearerAuth()
  async registerFCMToken(
    @Persona() userJWT: UserJwtPersona,
    @Body()
    body: RegisterUserFCMTokenDto,
  ) {
    await this.notificationsService.registerFCMToken(userJWT._id, body);

    return new CustomResponse().success({});
  }

  @Post('/unregister-fcm-token')
  @ApiBearerAuth()
  async unregisterFCMToken(
    @Persona() userJWT: UserJwtPersona,
    @Body()
    body: UnregisterFCMTokenDto,
  ) {
    await this.notificationsService.unregisterFCMToken(userJWT._id, body);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @UseGuards(VerifyS2SJwtToken)
  @Post('/send-single')
  @ApiBearerAuth()
  async sendUserNotification(@Body() body: SendSingleNotificationDto) {
    const { notification } = body;
    await this.userNotificationsService.sendNotification(notification);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @UseGuards(VerifyS2SJwtToken)
  @Post('/chat-message')
  @ApiBearerAuth()
  async sendUserChatNotification(@Body() body: SendMultiNotificationDto) {
    const { notifications } = body;
    await this.userNotificationsService.sendUserChatNotification(notifications);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @UseGuards(VerifyS2SJwtToken)
  @Post('/send-multi')
  @ApiBearerAuth()
  async sendMultiUserNotification(@Body() body: SendMultiNotificationDto) {
    const { notifications } = body;
    await this.userNotificationsService.sendNotification(notifications);

    return new CustomResponse().success({});
  }

  @IsPrivateAuthOrPublic()
  @UseGuards(VerifyS2SJwtToken)
  @Post('/validate')
  @ApiBearerAuth()
  async validateExistingNotification(
    @Body()
    body: UserNotificationValidationDto,
  ) {
    const notification = await this.notificationsService.validateExistingNotification(body);

    return new CustomResponse().success({
      payload: { data: notification },
    });
  }

  @Post('/notification/:notificationId')
  @ApiBearerAuth()
  async markNotificationRead(
    @Persona() userJWT: UserJwtPersona,
    @Param()
    params: MarkNotificationReadParamsDto,
  ) {
    await this.notificationsService.markNotificationRead(userJWT._id, params);

    return new CustomResponse().success({});
  }
}
