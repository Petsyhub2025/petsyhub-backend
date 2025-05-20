import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetUserSegmentsQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => obj[key] === 'true')
  isArchived?: boolean;
}
