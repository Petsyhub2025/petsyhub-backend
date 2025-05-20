import { Inject, Injectable } from '@nestjs/common';
import { IBranchServiceTypeModel, ModelNames } from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class BranchServiceTypesService {
  constructor(
    @Inject(ModelNames.BRANCH_SERVICE_TYPE)
    private branchServiceTypeModel: IBranchServiceTypeModel,
  ) {}

  async getBranchServiceTypes(serviceProviderId: string | Types.ObjectId) {
    const branchServiceTypes = await this.branchServiceTypeModel.find().lean();
    return branchServiceTypes;
  }
}
