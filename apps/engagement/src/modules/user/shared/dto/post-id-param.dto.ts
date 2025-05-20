import { IsMongoId } from 'class-validator';

export class PostIdParamDto {
  @IsMongoId()
  postId: string;
}
