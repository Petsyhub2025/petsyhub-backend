import { IsEnum, IsInstance, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ServiceProviderStatusEnum } from '@common/schemas/mongoose/serviceprovider/serviceprovider.enum';
import { BranchAccessPermissions } from '@common/schemas/mongoose/branch-access-control/branch-access-permissions';
import { BranchAccessRoleSubSchemaType } from '@common/schemas/mongoose/branch-access-control/subschemas/branch-access-role';
import { Types } from 'mongoose';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class ExtendedBranchAccessControlSubSchemaType {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  branch: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  permissions: BranchAccessPermissions;

  @IsObject()
  @ValidateNested()
  role: BranchAccessRoleSubSchemaType;

  @IsOptional()
  @IsString()
  @IsEnum(ServiceProviderStatusEnum)
  status?: ServiceProviderStatusEnum;
}
