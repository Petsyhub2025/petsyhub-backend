import { ApiProperty } from '@nestjs/swagger';
import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Types } from 'mongoose';

export class GetRoomMessagesQueryDto {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  beforeId?: Types.ObjectId;

  @IsOptional()
  @Min(1)
  @Max(50)
  @IsNumber()
  limit?: number = 10;
}
