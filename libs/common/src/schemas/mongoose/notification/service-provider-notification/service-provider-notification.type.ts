import { IsBoolean, IsEnum, IsInstance, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { ServiceProviderNotificationTypeEnum } from './service-provider-notification.enum';
import { TransformObjectId } from '@common/decorators/class-transformer';
import { Types } from 'mongoose';

export class ServiceProviderNotification extends BaseModel<ServiceProviderNotification> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  receiverServiceProvider: Types.ObjectId;

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
  @IsString()
  imageUrl?: string;

  @IsString()
  @IsEnum(ServiceProviderNotificationTypeEnum)
  notificationType: ServiceProviderNotificationTypeEnum;
}

export interface IServiceProviderNotificationInstanceMethods extends IBaseInstanceMethods {}
export interface IServiceProviderNotificationModel
  extends Model<ServiceProviderNotification, Record<string, unknown>, IServiceProviderNotificationInstanceMethods> {}
