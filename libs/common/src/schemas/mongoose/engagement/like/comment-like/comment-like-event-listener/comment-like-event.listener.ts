import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { CommentLikeEventsEnum } from '../comment-like.enum';
import { CommentLike } from '../comment-like.type';
import { ICommentModel } from '../../../comment/comment.type';

@Injectable()
export class CommentLikeEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.COMMENT)) private commentModel: ICommentModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(CommentLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, { promisify: true })
  async updateCommentCounts(event: HydratedDocument<CommentLike>) {
    return this.errorHandler.eventListenerErrorHandler(CommentLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, async () => {
      await this.commentModel.findByIdAndUpdate(event.comment, {
        $inc: { totalLikes: 1 },
      });
    });
  }

  @OnEvent(CommentLikeEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteCommentLike(event: HydratedDocument<CommentLike>) {
    return this.errorHandler.eventListenerErrorHandler(CommentLikeEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.comment ? [this.commentModel.findByIdAndUpdate(event.comment, { $inc: { totalLikes: -1 } })] : []),
      ]);
    });
  }
}
