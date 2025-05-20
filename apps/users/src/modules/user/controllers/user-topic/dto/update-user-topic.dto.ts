import { Topic, TransformObjectIds } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateUserTopicDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  userTopics: Types.ObjectId[];
}
