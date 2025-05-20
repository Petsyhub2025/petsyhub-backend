import { OmitType, PickType } from '@nestjs/swagger';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { BranchAccessPermissionOperations } from './branch-access-permissions-operations.type';
import { BranchAccessResourcesEnum } from './branch-access-permissions-resources.enum';

export class BranchAccessPermissionCreateReadUpdateDeleteOperation extends OmitType(BranchAccessPermissionOperations, [
  'filter',
] as const) {}
export class BranchAccessPermissionReadOperation extends PickType(BranchAccessPermissionOperations, [
  'read',
] as const) {}
export class BranchAccessPermissionReadUpdateOperation extends PickType(BranchAccessPermissionOperations, [
  'read',
  'update',
] as const) {}
export class BranchAccessPermissionReadUpdateDeleteOperation extends OmitType(BranchAccessPermissionOperations, [
  'create',
  'filter',
] as const) {}
export class BranchAccessPermissionCreateReadUpdateOperation extends OmitType(BranchAccessPermissionOperations, [
  'delete',
  'filter',
] as const) {}

export class BranchAccessPermissionReadFilterOperation extends PickType(BranchAccessPermissionOperations, [
  'read',
  'filter',
] as const) {}
export class BranchAccessPermissionReadFilterUpdateOperation extends PickType(BranchAccessPermissionOperations, [
  'read',
  'update',
  'filter',
] as const) {}
export class BranchAccessPermissionReadFilterUpdateDeleteOperation extends OmitType(BranchAccessPermissionOperations, [
  'create',
] as const) {}
export class BranchAccessPermissionCreateReadFilterUpdateOperation extends OmitType(BranchAccessPermissionOperations, [
  'delete',
] as const) {}

export class BranchAccessPermissions
  implements Record<BranchAccessResourcesEnum, Partial<BranchAccessPermissionOperations>>
{
  @IsObject()
  @ValidateNested()
  branches: BranchAccessPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  appointments: BranchAccessPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  staffMembers: BranchAccessPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  productCategories: BranchAccessPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  products: BranchAccessPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  inventory: BranchAccessPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  orders: BranchAccessPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  customers: BranchAccessPermissionReadOperation;
}
