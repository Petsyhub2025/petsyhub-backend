import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { IPetModel } from '../../pet.type';
import { PetFollowEventsEnum } from '../pet-follow.enum';
import { PetFollow } from '../pet-follow.type';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { IUserModel } from '@common/schemas/mongoose/user/user.type';

@Injectable()
export class PetFollowEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.PET)) private petModel: IPetModel,
    @Inject(forwardRef(() => ModelNames.USER)) private userModel: IUserModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(PetFollowEventsEnum.POST_SAVE_UPDATE_COUNTS, { promisify: true })
  async updateCounts(event: HydratedDocument<PetFollow>) {
    return this.errorHandler.eventListenerErrorHandler(PetFollowEventsEnum.POST_SAVE_UPDATE_COUNTS, async () => {
      await Promise.all([
        this.petModel.findByIdAndUpdate(event.following, {
          $inc: { totalFollowers: 1 },
        }),
        this.userModel.findByIdAndUpdate(event.follower, {
          $inc: { totalPetFollowings: 1 },
        }),
      ]);
    });
  }

  @OnEvent(PetFollowEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeletePetFollow(event: HydratedDocument<PetFollow>) {
    return this.errorHandler.eventListenerErrorHandler(PetFollowEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        this.petModel.findByIdAndUpdate(event.following, {
          $inc: { totalFollowers: -1 },
        }),
        this.userModel.findByIdAndUpdate(event.follower, {
          $inc: { totalPetFollowings: -1 },
        }),
      ]);
    });
  }
}
