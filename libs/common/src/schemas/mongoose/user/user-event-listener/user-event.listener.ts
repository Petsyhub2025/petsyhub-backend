import { ModelNames } from '@common/constants';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument, Types } from 'mongoose';
import { IBaseAppointmentModel } from '@common/schemas/mongoose/appointment/base-appointment.type';
import { ICommentReplyModel } from '@common/schemas/mongoose/engagement/comment-reply/comment-reply.type';
import { ICommentModel } from '@common/schemas/mongoose/engagement/comment/comment.type';
import { IFoundPostModel } from '@common/schemas/mongoose/lost-found/found-post/found-post.type';
import { ILostPostModel } from '@common/schemas/mongoose/lost-found/lost-post/lost-post.type';
import { IPetFollowModel } from '@common/schemas/mongoose/pet/pet-follow/pet-follow.type';
import { IPetModel } from '@common/schemas/mongoose/pet/pet.type';
import { IPostModel } from '@common/schemas/mongoose/post/post.type';
import { IPendingUserFollowModel } from '@common/schemas/mongoose/user/pending-user-follow';
import { IUserFollowModel } from '@common/schemas/mongoose/user/user-follow/user-follow.type';
import { UserEventsEnum } from '@common/schemas/mongoose/user/user.enum';
import { User } from '@common/schemas/mongoose/user/user.type';
import { IPendingPetFollowModel } from '@common/schemas/mongoose/pet/pending-pet-follow';
import { IPetMatchModel } from '@common/schemas/mongoose/matching/pet-match';
import { IEventModel } from '@common/schemas/mongoose/event/event.type';

@Injectable()
export class UserEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.POST)) private postModel: IPostModel,
    @Inject(forwardRef(() => ModelNames.PET)) private petModel: IPetModel,
    @Inject(forwardRef(() => ModelNames.COMMENT)) private commentModel: ICommentModel,
    @Inject(forwardRef(() => ModelNames.COMMENT_REPLY)) private commentReplyModel: ICommentReplyModel,
    @Inject(forwardRef(() => ModelNames.USER_FOLLOW)) private userFollowModel: IUserFollowModel,
    @Inject(forwardRef(() => ModelNames.PENDING_USER_FOLLOW)) private pendingUserFollowModel: IPendingUserFollowModel,
    @Inject(forwardRef(() => ModelNames.PENDING_PET_FOLLOW)) private pendingPetFollowModel: IPendingPetFollowModel,
    @Inject(forwardRef(() => ModelNames.PET_FOLLOW)) private petFollowModel: IPetFollowModel,
    @Inject(forwardRef(() => ModelNames.BASE_APPOINTMENT)) private baseAppointmentModel: IBaseAppointmentModel,
    @Inject(forwardRef(() => ModelNames.LOST_POST)) private lostPostModel: ILostPostModel,
    @Inject(forwardRef(() => ModelNames.FOUND_POST)) private foundPostModel: IFoundPostModel,
    @Inject(forwardRef(() => ModelNames.PET_MATCH)) private petMatchModel: IPetMatchModel,
    @Inject(forwardRef(() => ModelNames.EVENT)) private eventModel: IEventModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(UserEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteUser(event: HydratedDocument<User>) {
    return this.errorHandler.eventListenerErrorHandler(UserEventsEnum.DELETE_DOC, async () => {
      await this.deleteUserComments(event._id);
      await Promise.all([
        this.deleteUserCommentReplies(event._id),
        this.deleteUserFollows(event._id),
        this.deletePendingUserFollows(event._id),
        this.deletePendingPetFollows(event._id),
        this.deletePetFollows(event._id),
      ]);
      await Promise.all([
        this.deleteUserPosts(event._id),
        this.deleteUserPets(event._id),
        this.deleteUserAppointments(event._id),
        this.deleteUserLostPosts(event._id),
        this.deleteUserFoundPosts(event._id),
        this.deleteUserPetMatches(event._id),
        this.deleteUserEvents(event._id),
      ]);
    });
  }

  @OnEvent(UserEventsEnum.SUSPEND_DOC, { promisify: true })
  async propagateSuspendUser(event: HydratedDocument<User>) {
    return this.errorHandler.eventListenerErrorHandler(UserEventsEnum.SUSPEND_DOC, async () => {
      await Promise.all([
        this.suspendUserComments(event._id),
        this.suspendUserCommentReplies(event._id),
        this.suspendUserPosts(event._id),
        this.suspendUserPets(event._id),
        this.suspendUserLostPosts(event._id),
        this.suspendUserFoundPosts(event._id),
        this.suspendUserEvents(event._id),
      ]);
    });
  }

  @OnEvent(UserEventsEnum.UN_SUSPEND_DOC, { promisify: true })
  async propagateUnSuspendUser(event: HydratedDocument<User>) {
    return this.errorHandler.eventListenerErrorHandler(UserEventsEnum.UN_SUSPEND_DOC, async () => {
      await Promise.all([
        this.unSuspendUserComments(event._id),
        this.unSuspendUserCommentReplies(event._id),
        this.unSuspendUserPosts(event._id),
        this.unSuspendUserPets(event._id),
        this.unSuspendUserLostPosts(event._id),
        this.unSuspendUserFoundPosts(event._id),
        this.unSuspendUserEvents(event._id),
      ]);
    });
  }

  private async unSuspendUserPosts(userId: Types.ObjectId) {
    const posts = this.postModel.find({ authorUser: userId }).cursor();
    for await (const post of posts) {
      await post.unSuspendDocDueToUserSuspension();
    }
  }

  private async unSuspendUserComments(userId: Types.ObjectId) {
    const comments = this.commentModel.find({ authorUser: userId }).cursor();
    for await (const comment of comments) {
      await comment.unSuspendDocDueToUserSuspension();
    }
  }

  private async unSuspendUserCommentReplies(userId: Types.ObjectId) {
    const commentReplies = this.commentReplyModel.find({ authorUser: userId }).cursor();
    for await (const commentReply of commentReplies) {
      await commentReply.unSuspendDocDueToUserSuspension();
    }
  }

  private async suspendUserPosts(userId: Types.ObjectId) {
    const posts = this.postModel.find({ authorUser: userId }).cursor();
    for await (const post of posts) {
      await post.suspendDocDueToUserSuspension();
    }
  }

  private async suspendUserComments(userId: Types.ObjectId) {
    const comments = this.commentModel.find({ authorUser: userId }).cursor();
    for await (const comment of comments) {
      await comment.suspendDocDueToUserSuspension();
    }
  }

  private async suspendUserCommentReplies(userId: Types.ObjectId) {
    const commentReplies = this.commentReplyModel.find({ authorUser: userId }).cursor();
    for await (const commentReply of commentReplies) {
      await commentReply.suspendDocDueToUserSuspension();
    }
  }

  private async suspendUserLostPosts(userId: Types.ObjectId) {
    const lostPosts = this.lostPostModel.find({ authorUser: userId }).cursor();
    for await (const lostPost of lostPosts) {
      await lostPost.suspendDocDueToUserSuspension();
    }
  }

  private async suspendUserFoundPosts(userId: Types.ObjectId) {
    const foundPosts = this.foundPostModel.find({ authorUser: userId }).cursor();
    for await (const foundPost of foundPosts) {
      await foundPost.suspendDocDueToUserSuspension();
    }
  }

  private async suspendUserPets(userId: Types.ObjectId) {
    const pets = this.petModel.find({ 'user.userId': userId }).cursor();
    for await (const pet of pets) {
      await pet.suspendDocDueToUserSuspension();
    }
  }

  private async suspendUserEvents(userId: Types.ObjectId) {
    const events = this.eventModel.find({ authorUser: userId }).cursor();
    for await (const event of events) {
      await event.suspendDocDueToUserSuspension();
    }
  }

  private async unSuspendUserPets(userId: Types.ObjectId) {
    const pets = this.petModel.find({ 'user.userId': userId }).cursor();
    for await (const pet of pets) {
      await pet.unSuspendDocDueToUserSuspension();
    }
  }

  private async unSuspendUserLostPosts(userId: Types.ObjectId) {
    const lostPosts = this.lostPostModel.find({ authorUser: userId }).cursor();
    for await (const lostPost of lostPosts) {
      await lostPost.unSuspendDocDueToUserSuspension();
    }
  }

  private async unSuspendUserFoundPosts(userId: Types.ObjectId) {
    const foundPosts = this.foundPostModel.find({ authorUser: userId }).cursor();
    for await (const foundPost of foundPosts) {
      await foundPost.unSuspendDocDueToUserSuspension();
    }
  }

  private async unSuspendUserEvents(userId: Types.ObjectId) {
    const events = this.eventModel.find({ authorUser: userId }).cursor();
    for await (const event of events) {
      await event.unSuspendDocDueToUserSuspension();
    }
  }

  private async deletePendingUserFollows(userId: Types.ObjectId) {
    const follows = this.pendingUserFollowModel.find({ $or: [{ follower: userId }, { following: userId }] }).cursor();
    for await (const follow of follows) {
      await follow.deleteDoc();
    }
  }

  private async deletePendingPetFollows(userId: Types.ObjectId) {
    const follows = this.pendingPetFollowModel.find({ follower: userId }).cursor();
    for await (const follow of follows) {
      await follow.deleteDoc();
    }
  }

  private async deletePetFollows(userId: Types.ObjectId) {
    const follows = this.petFollowModel.find({ follower: userId }).cursor();
    for await (const follow of follows) {
      await follow.deleteDoc();
    }
  }

  private async deleteUserFollows(userId: Types.ObjectId) {
    const follows = this.userFollowModel.find({ $or: [{ follower: userId }, { following: userId }] }).cursor();
    for await (const follow of follows) {
      await follow.deleteDoc();
    }
  }

  private async deleteUserPosts(userId: Types.ObjectId) {
    const posts = this.postModel.find({ authorUser: userId }).cursor();
    for await (const post of posts) {
      await post.deleteDoc();
    }
  }

  private async deleteUserComments(userId: Types.ObjectId) {
    const comments = this.commentModel.find({ authorUser: userId }).cursor();
    for await (const comment of comments) {
      await comment.deleteDoc();
    }
  }

  private async deleteUserCommentReplies(userId: Types.ObjectId) {
    const commentReplies = this.commentReplyModel.find({ authorUser: userId }).cursor();
    for await (const commentReply of commentReplies) {
      await commentReply.deleteDoc();
    }
  }

  private async deleteUserPets(userId: Types.ObjectId) {
    const pets = this.petModel.find({ 'user.userId': userId }).cursor();
    for await (const pet of pets) {
      await pet.deleteDoc();
    }
  }

  private async deleteUserAppointments(userId: Types.ObjectId) {
    const appointments = this.baseAppointmentModel.find({ user: userId }).cursor();
    for await (const appointment of appointments) {
      await appointment.deleteDoc();
    }
  }

  private async deleteUserLostPosts(userId: Types.ObjectId) {
    const lostPosts = this.lostPostModel.find({ authorUser: userId }).cursor();
    for await (const lostPost of lostPosts) {
      await lostPost.deleteDoc();
    }
  }

  private async deleteUserFoundPosts(userId: Types.ObjectId) {
    const foundPosts = this.foundPostModel.find({ authorUser: userId }).cursor();
    for await (const foundPost of foundPosts) {
      await foundPost.deleteDoc();
    }
  }

  private async deleteUserPetMatches(userId: Types.ObjectId) {
    const petMatches = this.petMatchModel.find({ requesterUser: userId }).cursor();
    for await (const petMatch of petMatches) {
      await petMatch.deleteDoc();
    }
  }

  private async deleteUserEvents(userId: Types.ObjectId) {
    const events = this.eventModel.find({ authorUser: userId }).cursor();
    for await (const event of events) {
      await event.deleteDoc();
    }
  }
}
