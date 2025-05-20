import { PartialType, PickType } from '@nestjs/swagger';
import { BranchServiceType } from '@instapets-backend/common';

export class UpdateBranchServiceTypeDto extends PartialType(
  PickType(BranchServiceType, ['name', 'typePictureMedia', 'color', 'branchType'] as const),
) {}
