import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { IUserModel } from '../../user.type';
import { UserFollowEventsEnum } from '../user-follow.enum';
import { UserFollow } from '../user-follow.type';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';

@Injectable()
export class UserFollowEventListener {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(UserFollowEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, { promisify: true })
  async updateUserCounts(event: HydratedDocument<UserFollow>) {
    return this.errorHandler.eventListenerErrorHandler(UserFollowEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, async () => {
      await Promise.all([
        this.userModel.findByIdAndUpdate(event.following, {
          $inc: { totalFollowers: 1 },
        }),
        this.userModel.findByIdAndUpdate(event.follower, {
          $inc: { totalUserFollowings: 1 },
        }),
      ]);
    });
  }

  @OnEvent(UserFollowEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteUserFollow(event: HydratedDocument<UserFollow>) {
    return this.errorHandler.eventListenerErrorHandler(UserFollowEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        this.userModel.findByIdAndUpdate(event.following, {
          $inc: { totalFollowers: -1 },
        }),
        this.userModel.findByIdAndUpdate(event.follower, {
          $inc: { totalUserFollowings: -1 },
        }),
      ]);
    });
  }
}
