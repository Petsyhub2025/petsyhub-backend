import { Inject, Injectable } from '@nestjs/common';
import { IUserFollowModel, IUserModel, ModelNames } from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class UserFollowValidationService {
  constructor(
    @Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  async isUserFollowing(userId: string | Types.ObjectId, followingIds: Array<string | Types.ObjectId>) {
    const userFollows = await this.userFollowModel
      .find(
        {
          follower: userId,
          following: { $in: followingIds },
        },
        { _id: 1 },
      )
      .lean();

    return userFollows.length === followingIds.length;
  }

  async isUserFollowingOrPublic(userId: string | Types.ObjectId, followingIds: Array<string | Types.ObjectId>) {
    const userFollows = await this.userFollowModel.find({
      follower: userId,
      following: { $in: followingIds },
    });

    const indexedUserFollows = userFollows.reduce((acc, userFollow) => {
      acc[userFollow.following.toString()] = userFollow;
      return acc;
    }, {});

    const users = await this.userModel.find({
      _id: {
        $in: followingIds.filter((id) => !indexedUserFollows[id.toString()]),
      },
      isPrivate: false,
    });

    return userFollows.length + users.length === followingIds.length;
  }
}
