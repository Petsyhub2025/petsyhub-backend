import { PickType } from '@nestjs/swagger';
import { Comment } from '@instapets-backend/common';

export class CreateCommentDto extends PickType(Comment, ['body'] as const) {}
