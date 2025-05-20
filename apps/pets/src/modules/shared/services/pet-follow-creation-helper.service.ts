import { ModelNames } from '@common/constants';
import { IPetFollowModel } from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';

@Injectable()
export class PetFollowCreationHelperService {
  constructor(@Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel) {}

  async createPetFollow(
    follow: { following: string | Types.ObjectId; follower: string | Types.ObjectId },
    session?: ClientSession,
  ) {
    const petFollow = new this.petFollowModel(follow);
    return petFollow.save({ session });
  }
}
