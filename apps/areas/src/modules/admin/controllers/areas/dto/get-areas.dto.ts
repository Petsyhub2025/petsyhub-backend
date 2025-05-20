import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchPaginationQuery, TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class GetAreasQueryDto extends BaseSearchPaginationQuery {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  cityId: Types.ObjectId;
}
