import { IsMongoId } from 'class-validator';

export class BranchIdParamDto {
  @IsMongoId()
  branchId: string;
}
