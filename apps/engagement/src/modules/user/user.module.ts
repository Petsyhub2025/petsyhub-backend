import { Module } from '@nestjs/common';
import { SharedModule } from '@engagement/shared-module/shared.module';
import { CommentsController } from './controllers/comments/comments.controller';
import { RepliesController } from './controllers/replies/replies.controller';
import { LikesController } from './controllers/likes/likes.controller';
import { LikesService } from './controllers/likes/likes.service';
import { RepliesService } from './controllers/replies/replies.service';
import { CommentsService } from './controllers/comments/comments.service';
import { CommentEventListener } from './event-listeners/comments/comment.listener';
import { CommentReplyEventListener } from './event-listeners/replies/comment-reply.listener';
import { CommentLikeEventListener } from './event-listeners/likes/comment-like.listener';
import { CommentReplyLikeEventListener } from './event-listeners/likes/comment-reply-like.listener';
import { PostLikeEventListener } from './event-listeners/likes/post-like.listener';

@Module({
  imports: [SharedModule],
  controllers: [CommentsController, RepliesController, LikesController],
  providers: [
    LikesService,
    RepliesService,
    CommentsService,
    CommentLikeEventListener,
    CommentReplyLikeEventListener,
    PostLikeEventListener,
    CommentReplyEventListener,
    CommentEventListener,
  ],
})
export class UserModule {}
