import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';

export class GetUserFollowersQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => obj[key] === 'true')
  recent?: boolean;
}
