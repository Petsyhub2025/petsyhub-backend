import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetRepliesQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  commentId?: string;

  @IsOptional()
  @IsMongoId()
  postId?: string;

  @IsOptional()
  @IsMongoId()
  authorUserId?: string;
}
