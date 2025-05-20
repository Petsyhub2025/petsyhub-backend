import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ModelNames, IBranchAccessRoleModel } from '@instapets-backend/common';
import { CreateBranchAccessRoleDto } from './dto/create-branch-access-role.dto';
import { errorManager } from '@branches/admin/shared/config/errors.config';

@Injectable()
export class BranchAccessRoleService {
  constructor(
    @Inject(ModelNames.BRANCH_ACCESS_ROLE)
    private branchAccessRoleModel: IBranchAccessRoleModel,
  ) {}

  async createBranchAccessRole(adminId: string, body: CreateBranchAccessRoleDto) {
    const { name } = body;

    if (await this.branchAccessRoleModel.exists({ name })) {
      throw new ConflictException(errorManager.BRANCH_ACCESS_ROLE_NAME_EXISTS);
    }

    const createdBranchAccessRole = new this.branchAccessRoleModel(body);
    await createdBranchAccessRole.save();
  }
}
