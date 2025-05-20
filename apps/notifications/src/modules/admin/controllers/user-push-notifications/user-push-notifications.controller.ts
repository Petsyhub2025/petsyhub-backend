import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserPushNotificationIdParamDto } from '@notifications/admin/shared';
import { CancelUserPushNotificationDto } from './dto/cancel-user-push-notification.dto';
import { CreateUserPushNotificationDto } from './dto/create-push-notification.dto';
import { GetUserPushNotificationsQueryDto } from './dto/get-user-push-notifications.dto';
import { UpdateUserPushNotificationDto } from './dto/update-push-notification.dto';
import { UserPushNotificationsService } from './user-push-notifications.service';

@Controller({ path: 'marketing/user-push-notifications', version: VERSION_NEUTRAL })
@ApiTags('admin/user-push-notifications')
export class UserPushNotificationsController {
  constructor(private readonly userPushNotificationsService: UserPushNotificationsService) {}

  @ApiBearerAuth()
  @Get()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getUserPushNotifications(
    @Persona() adminJWT: AdminJwtPersona,
    @Query() query: GetUserPushNotificationsQueryDto,
  ) {
    const userPushNotifications = await this.userPushNotificationsService.getUserPushNotifications(adminJWT._id, query);

    return new CustomResponse().success({
      payload: userPushNotifications,
    });
  }

  @ApiBearerAuth()
  @Post()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.CREATE })
  async createUserPushNotification(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateUserPushNotificationDto) {
    const userPushNotification = await this.userPushNotificationsService.createUserPushNotification(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: userPushNotification },
    });
  }

  @ApiBearerAuth()
  @Get(':userPushNotificationId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getUserPushNotificationDetails(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: UserPushNotificationIdParamDto,
  ) {
    const userPushNotification = await this.userPushNotificationsService.getUserPushNotificationDetails(
      adminJWT._id,
      params,
    );

    return new CustomResponse().success({
      payload: { data: userPushNotification },
    });
  }

  @ApiBearerAuth()
  @Patch(':userPushNotificationId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async updateUserPushNotification(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: UserPushNotificationIdParamDto,
    @Body() body: UpdateUserPushNotificationDto,
  ) {
    const userPushNotification = await this.userPushNotificationsService.updateUserPushNotification(
      adminJWT._id,
      params,
      body,
    );

    return new CustomResponse().success({
      payload: { data: userPushNotification },
    });
  }

  @ApiBearerAuth()
  @Delete(':userPushNotificationId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.DELETE })
  async deleteUserPushNotification(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: UserPushNotificationIdParamDto,
  ) {
    await this.userPushNotificationsService.deleteUserPushNotification(adminJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':userPushNotificationId/cancel')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async cancelUserPushNotification(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: UserPushNotificationIdParamDto,
    @Body() body: CancelUserPushNotificationDto,
  ) {
    await this.userPushNotificationsService.cancelUserPushNotification(adminJWT._id, params, body);

    return new CustomResponse().success({});
  }
}
