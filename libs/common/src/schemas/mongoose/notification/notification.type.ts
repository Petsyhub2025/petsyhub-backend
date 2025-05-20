import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { AdminNotificationTypeEnum } from './admin-notification';
import { NotificationPriorityEnum } from './notification.enum';
import { UserNotificationTypeEnum } from './user-notification';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { OmitType } from '@nestjs/swagger';
import { ServiceProviderNotificationTypeEnum } from './service-provider-notification';
import { Media } from '@common/schemas/mongoose/common/media';

interface INotification {
  title: LocalizedText;
  body: LocalizedText;
  priority?: NotificationPriorityEnum;
  timeToLive?: number;
  data?: INotificationData;
  imageMedia?: Media;
  deepLink: string;
}

export interface INotificationData {
  [key: string]: any;
}

export class BaseNotificationDto implements INotification {
  @IsObject()
  @ValidateNested()
  title: LocalizedText;

  @IsObject()
  @ValidateNested()
  body: LocalizedText;

  @IsOptional()
  @IsString()
  @IsEnum(NotificationPriorityEnum)
  priority?: NotificationPriorityEnum = NotificationPriorityEnum.NORMAL;

  @IsOptional()
  @IsNumber()
  timeToLive?: number;

  @IsObject()
  @IsOptional()
  data?: INotificationData;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  imageMedia?: Media;

  @IsUrl()
  deepLink: string;
}

export interface IAdminNotification extends Omit<INotification, 'title' | 'body'> {
  title: string;
  body: string;
  notificationType: AdminNotificationTypeEnum;
}

export interface IUserTopicNotification extends Omit<INotification, 'title' | 'body'> {
  title: string;
  body: string;
  notificationType: UserNotificationTypeEnum;
  dynamicLink: string;
}

export interface IServiceProviderNotification extends INotification {
  receiverServiceProviderId: string;
  notificationType: ServiceProviderNotificationTypeEnum;
}

export class UserNotificationDto extends BaseNotificationDto {
  @IsMongoId()
  receiverUserId: string;

  @IsString()
  @IsEnum(UserNotificationTypeEnum)
  notificationType: UserNotificationTypeEnum;

  @IsString()
  @IsUrl()
  dynamicLink: string;
}

export class UserPushNotificationMulticastNotificationDto extends OmitType(BaseNotificationDto, [
  'title',
  'body',
] as const) {
  @IsString({ each: true })
  fcmTokens: string[];

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsString()
  @IsEnum(UserNotificationTypeEnum)
  notificationType: UserNotificationTypeEnum;

  @IsString()
  @IsUrl()
  dynamicLink: string;

  // @IsString()
  // @IsEnum(UserSettingsLanguageEnum)
  // targetLanguage: UserSettingsLanguageEnum;
}

export class UserNotificationValidationDto {
  @IsString()
  @IsNotEmpty()
  deepLink: string;

  @IsMongoId()
  receiverUserId: string;

  @IsString()
  @IsEnum(UserNotificationTypeEnum)
  notificationType: UserNotificationTypeEnum;
}
