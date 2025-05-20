import { ModelNames } from '@common/constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { IUserBlockModel } from '../user-block.type';

@Injectable()
export class UserBlockHelperService {
  constructor(@Inject(ModelNames.USER_BLOCK) private userBlockModel: IUserBlockModel) {}

  async areUsersMutuallyOrPartiallyBlocked(
    userId: string | Types.ObjectId,
    targetUser: string | Types.ObjectId,
    session?: ClientSession,
  ) {
    const userBlock = await this.userBlockModel
      .findOne({
        $or: [
          { blocker: userId, blocked: targetUser },
          { blocker: targetUser, blocked: userId },
        ],
      })
      .session(session)
      .lean();

    return !!userBlock;
  }
}
