import { Inject, Injectable } from '@nestjs/common';
import { IBaseBranchModel, IPetTypeModel, ModelNames } from '@instapets-backend/common';
import { Types } from 'mongoose';
import { GetSupportedPetTypesQueryDto } from './dto/get-supported-pet-types.dto';

@Injectable()
export class PetTypesService {
  constructor(
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    @Inject(ModelNames.BASE_BRANCH) private readonly baseBranchModel: IBaseBranchModel,
  ) {}

  async getPetTypes(clinicId: string) {
    return { data: await this.petTypeModel.find({}, { name: 1 }) };
  }

  async getBranchPetTypes(serviceProviderId: string | Types.ObjectId, { branchId }: GetSupportedPetTypesQueryDto) {
    const [branch] = await this.baseBranchModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(branchId),
        },
      },
      {
        $lookup: {
          from: 'pettypes',
          localField: 'petTypes',
          foreignField: '_id',
          as: 'petTypes',
        },
      },
      {
        $project: {
          petTypes: { _id: 1, name: 1 },
        },
      },
    ]);

    return branch.petTypes;
  }
}
