import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetUserFollowedPetsQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  excludePetId?: string;
}
