import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { PostLikeEventsEnum } from '../post-like.enum';
import { PostLike } from '../post-like.type';
import { IPostModel } from '@common/schemas/mongoose/post/post.type';

@Injectable()
export class PostLikeEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.POST)) private postModel: IPostModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(PostLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, { promisify: true })
  async updateCommentCounts(event: HydratedDocument<PostLike>) {
    return this.errorHandler.eventListenerErrorHandler(PostLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, async () => {
      await this.postModel.findByIdAndUpdate(event.post, {
        $inc: { totalLikes: 1 },
      });
    });
  }

  @OnEvent(PostLikeEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeletePostLike(event: HydratedDocument<PostLike>) {
    return this.errorHandler.eventListenerErrorHandler(PostLikeEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.post ? [this.postModel.findByIdAndUpdate(event.post, { $inc: { totalLikes: -1 } })] : []),
      ]);
    });
  }
}
