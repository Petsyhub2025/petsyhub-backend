import { PickType } from '@nestjs/swagger';
import { BranchAccessRole } from '@instapets-backend/common';

export class CreateBranchAccessRoleDto extends PickType(BranchAccessRole, ['name', 'level', 'branchTypes'] as const) {}
