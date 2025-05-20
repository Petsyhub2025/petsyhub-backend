import { ModelNames } from '@common/constants';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { IPostModel } from '@common/schemas/mongoose/post/post.type';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument, Types } from 'mongoose';
import { ICommentReplyModel } from '../../comment-reply/comment-reply.type';
import { ICommentLikeModel } from '../../like/comment-like/comment-like.type';
import { CommentEventsEnum } from '../comment.enum';
import { Comment } from '../comment.type';

@Injectable()
export class CommentEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.POST)) private postModel: IPostModel,
    @Inject(forwardRef(() => ModelNames.COMMENT_LIKE)) private commentLikeModel: ICommentLikeModel,
    @Inject(forwardRef(() => ModelNames.COMMENT_REPLY)) private commentReplyModel: ICommentReplyModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(CommentEventsEnum.POST_SAVE_UPDATE_POST_COUNTS, { promisify: true })
  async updatePostCounts(event: HydratedDocument<Comment>) {
    return this.errorHandler.eventListenerErrorHandler(CommentEventsEnum.POST_SAVE_UPDATE_POST_COUNTS, async () => {
      await this.postModel.findByIdAndUpdate(event.post, {
        $inc: { totalComments: 1 },
      });
    });
  }

  @OnEvent(CommentEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteComment(event: HydratedDocument<Comment>) {
    return this.errorHandler.eventListenerErrorHandler(CommentEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.post ? [this.postModel.findByIdAndUpdate(event.post, { $inc: { totalComments: -1 } })] : []),
        this.deleteCommentLikes(event._id),
        this.deleteCommentReplies(event._id),
      ]);
    });
  }

  @OnEvent(CommentEventsEnum.SUSPEND_DOC, { promisify: true })
  async propagateSuspendComment(event: HydratedDocument<Comment>) {
    return this.errorHandler.eventListenerErrorHandler(CommentEventsEnum.SUSPEND_DOC, async () => {
      await this.suspendCommentReplies(event._id);
    });
  }

  @OnEvent(CommentEventsEnum.UN_SUSPEND_DOC, { promisify: true })
  async propagateUnSuspendComment(event: HydratedDocument<Comment>) {
    return this.errorHandler.eventListenerErrorHandler(CommentEventsEnum.UN_SUSPEND_DOC, async () => {
      await this.unSuspendCommentReplies(event._id);
    });
  }

  private async suspendCommentReplies(commentId: Types.ObjectId) {
    const commentReplies = this.commentReplyModel.find({ replyOn: commentId }).cursor();
    for await (const commentReply of commentReplies) {
      await commentReply.suspendDocDueToCommentSuspension();
    }
  }

  private async unSuspendCommentReplies(commentId: Types.ObjectId) {
    const commentReplies = this.commentReplyModel.find({ replyOn: commentId }).cursor();
    for await (const commentReply of commentReplies) {
      await commentReply.unSuspendDocDueToCommentSuspension();
    }
  }

  private async deleteCommentLikes(commentId: Types.ObjectId) {
    const commentLikes = this.commentLikeModel.find({ comment: commentId }).cursor();
    for await (const commentLike of commentLikes) {
      await commentLike.deleteDoc();
    }
  }

  private async deleteCommentReplies(commentId: Types.ObjectId) {
    const commentReplies = this.commentReplyModel.find({ replyOn: commentId }).cursor();
    for await (const commentReply of commentReplies) {
      await commentReply.deleteDoc();
    }
  }
}
