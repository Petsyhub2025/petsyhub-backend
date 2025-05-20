import { IsEnum, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { AdminNotificationTypeEnum } from './admin-notification.enum';
import { Media } from '@common/schemas/mongoose/common/media';

export class AdminNotification extends BaseModel<AdminNotification> {
  @IsString()
  @MaxLength(1000)
  title: string;

  @IsString()
  @MaxLength(1000)
  body: string;

  @IsString()
  deepLink: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  imageMedia?: Media;

  @IsString()
  @IsEnum(AdminNotificationTypeEnum)
  notificationType: AdminNotificationTypeEnum;
}

export interface IAdminNotificationInstanceMethods extends IBaseInstanceMethods {}
export interface IAdminNotificationModel
  extends Model<AdminNotification, Record<string, unknown>, IAdminNotificationInstanceMethods> {}
