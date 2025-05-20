import { BasePaginationQuery, TransformArray } from '@instapets-backend/common';
import { ArrayNotEmpty, IsArray, IsMongoId, IsOptional, Validate } from 'class-validator';
import { IsUserAndPetIdProvided } from '@posts/user/controllers/posts/custom-validation/get-posts.class';

export class GetPostsQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsMongoId()
  @Validate(IsUserAndPetIdProvided)
  userId?: string;

  @IsOptional()
  @IsMongoId()
  @Validate(IsUserAndPetIdProvided)
  petId?: string;

  @IsOptional()
  @IsMongoId()
  country?: string;

  @IsOptional()
  @IsMongoId()
  city?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  @TransformArray()
  taggedUsers?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  @TransformArray()
  taggedPets?: string[];
}
