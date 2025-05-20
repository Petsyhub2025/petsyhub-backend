import { PickType } from '@nestjs/swagger';
import { CommentReply } from '@instapets-backend/common';

export class CreateReplyDto extends PickType(CommentReply, ['body'] as const) {}
