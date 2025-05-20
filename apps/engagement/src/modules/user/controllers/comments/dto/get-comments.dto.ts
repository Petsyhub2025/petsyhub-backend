import { PickType } from '@nestjs/swagger';
import { BasePaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetCommentsQueryDto extends PickType(BasePaginationQuery, ['limit'] as const) {
  @IsMongoId()
  @IsOptional()
  afterId?: string;
}
