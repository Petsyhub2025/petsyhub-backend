import { IsInstance, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class ServiceProviderFCMToken extends BaseModel<ServiceProviderFCMToken> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  serviceProvider: Types.ObjectId;

  @IsString()
  fcmToken: string;
}

export type IServiceProviderFCMTokenInstanceMethods = IBaseInstanceMethods;
export type IServiceProviderFCMTokenModel = Model<
  ServiceProviderFCMToken,
  Record<string, unknown>,
  IServiceProviderFCMTokenInstanceMethods
>;
