import { IsMongoId } from 'class-validator';

export class CommentIdParamDto {
  @IsMongoId()
  commentId: string;
}
