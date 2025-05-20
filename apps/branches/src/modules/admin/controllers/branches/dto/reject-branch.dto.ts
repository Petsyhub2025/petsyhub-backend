import { IsString, MinLength } from 'class-validator';

export class RejectBranchDto {
  @IsString()
  @MinLength(10)
  rejectionReason: string;
}
