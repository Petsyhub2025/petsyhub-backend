import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsObject, ValidateNested, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { UserNotificationTypeEnum } from './user-notification.enum';
import { Media } from '@common/schemas/mongoose/common/media';

export class UserNotification extends BaseModel<UserNotification> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  receiverUser: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  title: LocalizedText;

  @IsObject()
  @ValidateNested()
  body: LocalizedText;

  @IsString()
  deepLink: string;

  @IsBoolean()
  isRead: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  imageMedia?: Media;

  @IsString()
  @IsEnum(UserNotificationTypeEnum)
  notificationType: UserNotificationTypeEnum;
}

export interface IUserNotificationInstanceMethods extends IBaseInstanceMethods {}
export interface IUserNotificationModel
  extends Model<UserNotification, Record<string, unknown>, IUserNotificationInstanceMethods> {}
