import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsArray, IsEnum, IsInstance, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { AdminFcmTopicsEnum } from '@common/enums';

export class AdminFCMToken extends BaseModel<AdminFCMToken> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  admin: Types.ObjectId;

  @IsString()
  fcmToken: string;

  @IsArray()
  @IsString({ each: true })
  @IsEnum(AdminFcmTopicsEnum, { each: true })
  topics: AdminFcmTopicsEnum[];
}

export type IAdminFCMTokenInstanceMethods = IBaseInstanceMethods;
export type IAdminFCMTokenModel = Model<AdminFCMToken, Record<string, unknown>, IAdminFCMTokenInstanceMethods>;
