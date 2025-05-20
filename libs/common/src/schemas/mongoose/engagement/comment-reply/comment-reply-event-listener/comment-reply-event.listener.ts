import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument, Types } from 'mongoose';
import { ICommentModel } from '../../comment/comment.type';
import { CommentReplyEventsEnum } from '../comment-reply.enum';
import { CommentReply } from '../comment-reply.type';
import { ICommentReplyLikeModel } from '../../like/comment-reply-like/comment-reply-like.type';

@Injectable()
export class CommentReplyEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.COMMENT)) private commentModel: ICommentModel,
    @Inject(forwardRef(() => ModelNames.COMMENT_REPLY_LIKE)) private commentReplyLikeModel: ICommentReplyLikeModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(CommentReplyEventsEnum.POST_SAVE_UPDATE_COMMENT_COUNTS, { promisify: true })
  async updateCommentCounts(event: HydratedDocument<CommentReply>) {
    return this.errorHandler.eventListenerErrorHandler(
      CommentReplyEventsEnum.POST_SAVE_UPDATE_COMMENT_COUNTS,
      async () => {
        await this.commentModel.findByIdAndUpdate(event.replyOn, {
          $inc: { totalReplies: 1 },
        });
      },
    );
  }

  @OnEvent(CommentReplyEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteComment(event: HydratedDocument<CommentReply>) {
    return this.errorHandler.eventListenerErrorHandler(CommentReplyEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.replyOn ? [this.commentModel.findByIdAndUpdate(event.replyOn, { $inc: { totalReplies: -1 } })] : []),
        ...(event._id ? [this.deleteCommentReplyLikes(event._id)] : []),
      ]);
    });
  }

  private async deleteCommentReplyLikes(commentReplyId: Types.ObjectId) {
    const commentReplyLikes = this.commentReplyLikeModel.find({ commentReply: commentReplyId }).cursor();
    for await (const commentReplyLike of commentReplyLikes) {
      await commentReplyLike.deleteDoc();
    }
  }
}
