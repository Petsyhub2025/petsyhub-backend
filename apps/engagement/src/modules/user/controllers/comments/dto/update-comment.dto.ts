import { PickType } from '@nestjs/swagger';
import { Comment } from '@instapets-backend/common';

export class UpdateCommentDto extends PickType(Comment, ['body'] as const) {}
