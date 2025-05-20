import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetCommentsQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  postId?: string;

  @IsOptional()
  @IsMongoId()
  authorUserId?: string;
}
