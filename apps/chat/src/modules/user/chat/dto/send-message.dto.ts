import { PickType } from '@nestjs/swagger';
import { ChatMessage, IsMediaUploadFileValid, MediaUploadFile, TransformObjectId } from '@instapets-backend/common';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInstance,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class SendMessageDto extends PickType(ChatMessage, ['body'] as const) {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  roomId: Types.ObjectId;

  @IsOptional()
  @IsString()
  clientPendingMessageId?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @IsMediaUploadFileValid({ s3Only: true }, { each: true })
  @Type(() => MediaUploadFile)
  mediaUploads?: MediaUploadFile[];
}
