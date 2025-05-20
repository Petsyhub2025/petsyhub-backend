import { BranchTypeEnum } from '@instapets-backend/common';
import { IsEnum, IsString } from 'class-validator';

export class GetBranchAccessRolesQueryDto {
  @IsString()
  @IsEnum(BranchTypeEnum)
  branchType: BranchTypeEnum;
}
