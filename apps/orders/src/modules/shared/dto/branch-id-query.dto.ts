import { IsMongoId } from 'class-validator';

export class BranchIdQueryDto {
  @IsMongoId()
  branchId: string;
}
