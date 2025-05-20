import { ModelNames } from '@common/constants';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument, Types } from 'mongoose';
import { ILostPostModel } from '@common/schemas/mongoose/lost-found/lost-post/lost-post.type';
import { IPostModel } from '@common/schemas/mongoose/post/post.type';
import { IUserModel } from '@common/schemas/mongoose/user/user.type';
import { IPendingPetFollowModel } from '@common/schemas/mongoose/pet/pending-pet-follow';
import { IPetFollowModel } from '@common/schemas/mongoose/pet/pet-follow/pet-follow.type';
import { PetEventsEnum } from '@common/schemas/mongoose/pet/pet.enum';
import { Pet } from '@common/schemas/mongoose/pet/pet.type';
import { IPetMatchModel } from '@common/schemas/mongoose/matching/pet-match';

@Injectable()
export class PetEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.USER)) private userModel: IUserModel,
    @Inject(forwardRef(() => ModelNames.POST)) private postModel: IPostModel,
    @Inject(forwardRef(() => ModelNames.PET_FOLLOW)) private petFollowModel: IPetFollowModel,
    @Inject(ModelNames.PENDING_PET_FOLLOW) private pendingPetFollowModel: IPendingPetFollowModel,
    @Inject(forwardRef(() => ModelNames.LOST_POST)) private lostPostModel: ILostPostModel,
    @Inject(forwardRef(() => ModelNames.PET_MATCH)) private petMatchModel: IPetMatchModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(PetEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, { promisify: true })
  async updateUserCounts(event: HydratedDocument<Pet>) {
    return this.errorHandler.eventListenerErrorHandler(PetEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, async () => {
      await this.userModel.findByIdAndUpdate(event.user.userId, {
        $inc: { totalPets: 1 },
      });
    });
  }

  @OnEvent(PetEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeletePet(event: HydratedDocument<Pet>) {
    return this.errorHandler.eventListenerErrorHandler(PetEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        this.deletePetPosts(event._id),
        this.deletePetFollows(event._id),
        this.deletePendingPetFollows(event._id),
        this.deletePetLostPosts(event._id),
        this.deletePetMatches(event._id),
        this.userModel.findByIdAndUpdate(event.user.userId, {
          $inc: { totalPets: -1 },
        }),
      ]);
    });
  }

  @OnEvent(PetEventsEnum.SUSPEND_DOC_DUE_TO_SUSPENSION_AT, { promisify: true })
  async propagateSuspendPetDueToUserSuspend(event: HydratedDocument<Pet>) {
    return this.errorHandler.eventListenerErrorHandler(PetEventsEnum.SUSPEND_DOC_DUE_TO_SUSPENSION_AT, async () => {
      await this.suspendPetPosts(event._id);
    });
  }

  @OnEvent(PetEventsEnum.UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT, { promisify: true })
  async propagateUnSuspendPetDueToUserSuspend(event: HydratedDocument<Pet>) {
    return this.errorHandler.eventListenerErrorHandler(PetEventsEnum.UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT, async () => {
      await this.unSuspendPetPosts(event._id);
    });
  }

  private async unSuspendPetPosts(petId: Types.ObjectId) {
    const posts = this.postModel.find({ authorPet: petId }).cursor();
    for await (const post of posts) {
      await post.unSuspendDocDueToUserSuspension();
    }
  }

  private async suspendPetPosts(petId: Types.ObjectId) {
    const posts = this.postModel.find({ authorPet: petId }).cursor();
    for await (const post of posts) {
      await post.suspendDocDueToUserSuspension();
    }
  }

  private async deletePetLostPosts(petId: Types.ObjectId) {
    const posts = this.lostPostModel.find({ pet: petId }).cursor();
    for await (const post of posts) {
      await post.deleteDoc();
    }
  }

  private async deletePetMatches(petId: Types.ObjectId) {
    const matches = this.petMatchModel.find({ pet: petId }).cursor();
    for await (const match of matches) {
      await match.deleteDoc();
    }
  }

  private async deletePendingPetFollows(petId: Types.ObjectId) {
    const follows = this.pendingPetFollowModel.find({ following: petId }).cursor();
    for await (const follow of follows) {
      await follow.deleteDoc();
    }
  }

  private async deletePetFollows(petId: Types.ObjectId) {
    const follows = this.petFollowModel.find({ following: petId }).cursor();
    for await (const follow of follows) {
      await follow.deleteDoc();
    }
  }

  private async deletePetPosts(petId: Types.ObjectId) {
    const posts = this.postModel.find({ authorPet: petId }).cursor();
    for await (const post of posts) {
      await post.deleteDoc();
    }
  }
}
