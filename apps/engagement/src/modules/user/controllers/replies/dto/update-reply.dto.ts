import { PickType } from '@nestjs/swagger';
import { CommentReply } from '@instapets-backend/common';

export class UpdateReplyDto extends PickType(CommentReply, ['body'] as const) {}
