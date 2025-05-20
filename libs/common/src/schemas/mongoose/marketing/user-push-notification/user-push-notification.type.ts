import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { ShouldUserSegmentsBeProvided } from '@common/decorators/class-validator/user-push-notifications';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Media } from '@common/schemas/mongoose/common/media';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInstance,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ClientSession, Model, Types } from 'mongoose';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { UserPushNotificationStatusEnum } from './user-push-notification.enum';

export class UserPushNotification extends BaseModel<UserPushNotification> {
  @IsString()
  name: string;

  @IsObject()
  @ValidateNested()
  title: LocalizedText;

  @IsObject()
  @ValidateNested()
  body: LocalizedText;

  @IsObject()
  @ValidateNested()
  media: Media;

  @IsOptional()
  @IsUUID()
  mediaProcessingId?: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String, description: 'ObjectId' })
  dynamicLinkId: Types.ObjectId;

  @IsBoolean()
  @Validate(ShouldUserSegmentsBeProvided)
  includeAllUsers: boolean;

  @ValidateIf((o) => o.includeAllUsers === false)
  @IsArray()
  @ArrayMinSize(1)
  @IsInstance(Types.ObjectId, { each: true })
  @Validate(ShouldUserSegmentsBeProvided)
  @TransformObjectIds()
  @ApiProperty({ type: [String], description: 'ObjectId[]' })
  userSegments: Types.ObjectId[];

  @IsString()
  @IsEnum(UserPushNotificationStatusEnum)
  status: UserPushNotificationStatusEnum;

  @IsDate()
  scheduledDate: Date;

  @IsOptional()
  @IsDate()
  cancelledAt?: Date;

  @ValidateIf((o) => o.cancelledAt != undefined)
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsNumber()
  usersCount?: number;
}

export interface IUserPushNotificationInstanceMethods extends IBaseInstanceMethods {
  cancelDoc: (cancellationReason: string, session: ClientSession) => Promise<void>;
}
export interface IUserPushNotificationModel
  extends Model<UserPushNotification, Record<string, unknown>, IUserPushNotificationInstanceMethods> {}
