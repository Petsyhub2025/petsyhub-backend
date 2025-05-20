import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetUserFollowingsQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
