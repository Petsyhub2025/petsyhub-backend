import { PickType } from '@nestjs/swagger';
import { BranchServiceType } from '@instapets-backend/common';

export class CreateBranchServiceTypeDto extends PickType(BranchServiceType, [
  'name',
  'color',
  'typePictureMedia',
  'branchType',
] as const) {}
