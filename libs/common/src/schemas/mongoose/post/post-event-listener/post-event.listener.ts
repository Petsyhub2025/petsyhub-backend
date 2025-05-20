import { ModelNames } from '@common/constants';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument, Types } from 'mongoose';
import { ICommentModel } from '../../engagement/comment/comment.type';
import { IPostLikeModel } from '../../engagement/like/post-like/post-like.type';
import { IPetModel } from '../../pet/pet.type';
import { IUserModel } from '../../user/user.type';
import { PostEventsEnum } from '../post.enum';
import { Post } from '../post.type';

@Injectable()
export class PostEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.USER)) private userModel: IUserModel,
    @Inject(forwardRef(() => ModelNames.PET)) private petModel: IPetModel,
    @Inject(forwardRef(() => ModelNames.COMMENT)) private commentModel: ICommentModel,
    @Inject(forwardRef(() => ModelNames.POST_LIKE)) private postLikeModel: IPostLikeModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(PostEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, { promisify: true })
  async updateUserCounts(event: HydratedDocument<Post>) {
    return this.errorHandler.eventListenerErrorHandler(PostEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, async () => {
      await this.userModel.findByIdAndUpdate(event.authorUser, {
        $inc: { totalPosts: 1 },
      });
    });
  }

  @OnEvent(PostEventsEnum.POST_SAVE_UPDATE_PET_COUNTS, { promisify: true })
  async updatePetCounts(event: HydratedDocument<Post>) {
    return this.errorHandler.eventListenerErrorHandler(PostEventsEnum.POST_SAVE_UPDATE_PET_COUNTS, async () => {
      await this.petModel.findByIdAndUpdate(event.authorPet, {
        $inc: { totalPosts: 1 },
      });
    });
  }

  @OnEvent(PostEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeletePost(event: HydratedDocument<Post>) {
    return this.errorHandler.eventListenerErrorHandler(PostEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.authorUser ? [this.userModel.findByIdAndUpdate(event.authorUser, { $inc: { totalPosts: -1 } })] : []),
        ...(event.authorPet ? [this.petModel.findByIdAndUpdate(event.authorPet, { $inc: { totalPosts: -1 } })] : []),
        ...(event._id ? [this.deletePostComments(event._id), this.deletePostLikes(event._id)] : []),
      ]);
    });
  }

  @OnEvent(PostEventsEnum.SUSPEND_DOC, { promisify: true })
  async propagateSuspendPost(event: HydratedDocument<Post>) {
    return this.errorHandler.eventListenerErrorHandler(PostEventsEnum.SUSPEND_DOC, async () => {
      await this.suspendPostComments(event._id);
    });
  }

  @OnEvent(PostEventsEnum.UN_SUSPEND_DOC, { promisify: true })
  async propagateUnSuspendPost(event: HydratedDocument<Post>) {
    return this.errorHandler.eventListenerErrorHandler(PostEventsEnum.UN_SUSPEND_DOC, async () => {
      await this.unSuspendPostComments(event._id);
    });
  }

  private async suspendPostComments(postId: Types.ObjectId) {
    const comments = this.commentModel.find({ post: postId }).cursor();
    for await (const comment of comments) {
      await comment.suspendDocDueToPostSuspension();
    }
  }

  private async unSuspendPostComments(postId: Types.ObjectId) {
    const comments = this.commentModel.find({ post: postId }).cursor();
    for await (const comment of comments) {
      await comment.unSuspendDocDueToPostSuspension();
    }
  }

  private async deletePostComments(postId: Types.ObjectId) {
    const comments = this.commentModel.find({ post: postId }).cursor();
    for await (const comment of comments) {
      await comment.deleteDoc();
    }
  }

  private async deletePostLikes(postId: Types.ObjectId) {
    const postLikes = this.postLikeModel.find({ post: postId }).cursor();
    for await (const postLike of postLikes) {
      await postLike.deleteDoc();
    }
  }
}
