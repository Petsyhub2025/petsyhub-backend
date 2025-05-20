import { ApiProperty } from '@nestjs/swagger';
import { BasePaginationQuery, TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetAllPostImagesQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  petId?: Types.ObjectId;
}
