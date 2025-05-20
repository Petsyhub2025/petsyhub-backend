import { TransformObjectId } from '@common/decorators/class-transformer';
import { HasContent } from '@common/decorators/class-validator/chat';
import { Type } from 'class-transformer';
import {
  IsInstance,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  Validate,
  IsUUID,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Media } from '@common/schemas/mongoose/common/media';

export class ChatMessage extends BaseModel<ChatMessage> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  room: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  sender: Types.ObjectId;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Media)
  @Validate(HasContent)
  media: Media[] = [];

  @IsOptional()
  @IsUUID()
  mediaProcessingId?: string;

  @IsOptional()
  isSent?: boolean;

  @IsOptional()
  isRead?: boolean;

  @IsOptional()
  isDeleted?: boolean;
}

export interface IChatMessageInstanceMethods extends IBaseInstanceMethods {}
export interface IChatMessageModel extends Model<ChatMessage, Record<string, unknown>, IChatMessageInstanceMethods> {}
