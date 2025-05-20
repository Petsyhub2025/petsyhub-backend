import { IsMongoId } from 'class-validator';

export class ReplyIdParamDto {
  @IsMongoId()
  replyId: string;
}
