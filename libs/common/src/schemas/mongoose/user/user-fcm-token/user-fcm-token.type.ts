import { IsEnum, IsInstance, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { UserFCMTokenPlatformEnum } from './user-fcm-token.enum';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class UserFCMToken extends BaseModel<UserFCMToken> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;

  @IsString()
  fcmToken: string;

  @IsString()
  appVersion: string;

  @IsString()
  @IsEnum(UserFCMTokenPlatformEnum)
  platform: UserFCMTokenPlatformEnum;
}

export type IUserFCMTokenInstanceMethods = IBaseInstanceMethods;
export type IUserFCMTokenModel = Model<UserFCMToken, Record<string, unknown>, IUserFCMTokenInstanceMethods>;
