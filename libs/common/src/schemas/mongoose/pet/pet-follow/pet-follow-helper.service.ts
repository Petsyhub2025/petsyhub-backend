import { ModelNames } from '@common/constants';
import { Inject, Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import { Pet } from '../pet.type';
import { IPetFollowModel } from './pet-follow.type';

@Injectable()
export class PetFollowHelperService {
  constructor(@Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel) {}

  async canUserViewPetContent(pet: HydratedDocument<Pet>, userId: string, extraCondition = true) {
    const isPublic = pet?.isPrivate === false;
    const isPrivateAndFollowing =
      !isPublic && (await this.petFollowModel.exists({ follower: userId, following: pet._id }));

    return (isPublic || isPrivateAndFollowing) && extraCondition;
  }
}
