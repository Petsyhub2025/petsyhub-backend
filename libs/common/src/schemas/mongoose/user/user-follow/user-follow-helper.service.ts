import { ModelNames } from '@common/constants';
import { Inject, Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import { User } from '../user.type';
import { IUserFollowModel } from './user-follow.type';

@Injectable()
export class UserFollowHelperService {
  constructor(@Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel) {}

  async canUserViewUserContent(user: HydratedDocument<User>, userId: string, extraCondition = true) {
    const isPublic = user?.isPrivate === false;
    const isPrivateAndFollowing =
      !isPublic && (await this.userFollowModel.exists({ follower: userId, following: user._id }));

    return (isPublic || isPrivateAndFollowing) && extraCondition;
  }
}
