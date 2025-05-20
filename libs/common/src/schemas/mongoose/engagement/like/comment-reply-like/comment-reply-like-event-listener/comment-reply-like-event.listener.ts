import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { ModelNames } from '@common/constants';
import { CommentReplyLike } from '../comment-reply-like.type';
import { CommentReplyLikeEventsEnum } from '../comment-reply-like.enum';
import { ICommentReplyModel } from '../../../comment-reply/comment-reply.type';

@Injectable()
export class CommentReplyLikeEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.COMMENT_REPLY)) private commentReplyModel: ICommentReplyModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(CommentReplyLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, { promisify: true })
  async updateCommentCounts(event: HydratedDocument<CommentReplyLike>) {
    return this.errorHandler.eventListenerErrorHandler(
      CommentReplyLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS,
      async () => {
        await this.commentReplyModel.findByIdAndUpdate(event.commentReply, {
          $inc: { totalLikes: 1 },
        });
      },
    );
  }

  @OnEvent(CommentReplyLikeEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteCommentReplyLike(event: HydratedDocument<CommentReplyLike>) {
    return this.errorHandler.eventListenerErrorHandler(CommentReplyLikeEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.commentReply
          ? [this.commentReplyModel.findByIdAndUpdate(event.commentReply, { $inc: { totalLikes: -1 } })]
          : []),
      ]);
    });
  }
}
