import { ApiProperty } from '@nestjs/swagger';
import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class FoundPostIdParamDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({
    type: String,
  })
  foundPostId: Types.ObjectId;
}
