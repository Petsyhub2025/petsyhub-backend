import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsUserAndPetIdProvided } from '@posts/user/controllers/posts/custom-validation/get-posts.class';
import { IsMongoId, IsOptional, Validate } from 'class-validator';

export class GetPostsQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  @Validate(IsUserAndPetIdProvided)
  userId?: string;

  @IsOptional()
  @IsMongoId()
  @Validate(IsUserAndPetIdProvided)
  petId?: string;
}
