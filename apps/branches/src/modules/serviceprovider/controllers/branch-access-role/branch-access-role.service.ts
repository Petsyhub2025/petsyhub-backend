import { Inject, Injectable } from '@nestjs/common';
import { ModelNames, IBranchAccessRoleModel } from '@instapets-backend/common';
import { GetBranchAccessRolesQueryDto } from './dto/get-branch-access-role.dto';

@Injectable()
export class BranchAccessRoleService {
  constructor(
    @Inject(ModelNames.BRANCH_ACCESS_ROLE)
    private branchAccessRoleModel: IBranchAccessRoleModel,
  ) {}

  async getBranchAccessRoles(serviceProviderId: string, { branchType }: GetBranchAccessRolesQueryDto) {
    return await this.branchAccessRoleModel.find({ branchTypes: branchType }, { name: 1 }).lean();
  }
}
