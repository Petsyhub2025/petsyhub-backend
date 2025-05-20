import { IsEnum, IsInstance, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { CustomerFCMTokenPlatformEnum } from './customer-fcm-token.enum';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class CustomerFCMToken extends BaseModel<CustomerFCMToken> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  customer: Types.ObjectId;

  @IsString()
  fcmToken: string;

  @IsString()
  appVersion: string;

  @IsString()
  @IsEnum(CustomerFCMTokenPlatformEnum)
  platform: CustomerFCMTokenPlatformEnum;
}

export type ICustomerFCMTokenInstanceMethods = IBaseInstanceMethods;
export type ICustomerFCMTokenModel = Model<CustomerFCMToken, Record<string, unknown>, ICustomerFCMTokenInstanceMethods>;
