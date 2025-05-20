import { ApiProperty } from '@nestjs/swagger';
import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class InitDirectMessageDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  recipientId: Types.ObjectId;
}
