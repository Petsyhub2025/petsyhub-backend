import { IsMongoId } from 'class-validator';

export class ProviderBranchIdParamDto {
  @IsMongoId()
  providerBranchId: string;
}
