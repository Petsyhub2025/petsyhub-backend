import { OmitType, PickType } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { AdminPermissionOperations } from './admin-operations.type';
import { AdminResourcesEnum } from './admin-resources.enum';

export class AdminPermissionCreateReadUpdateDeleteOperation extends OmitType(AdminPermissionOperations, [
  'filter',
] as const) {}
export class AdminPermissionReadOperation extends PickType(AdminPermissionOperations, ['read'] as const) {}
export class AdminPermissionReadUpdateOperation extends PickType(AdminPermissionOperations, [
  'read',
  'update',
] as const) {}
export class AdminPermissionReadUpdateDeleteOperation extends OmitType(AdminPermissionOperations, [
  'create',
  'filter',
] as const) {}
export class AdminPermissionCreateReadUpdateOperation extends OmitType(AdminPermissionOperations, [
  'delete',
  'filter',
] as const) {}

export class AdminPermissionReadFilterOperation extends PickType(AdminPermissionOperations, [
  'read',
  'filter',
] as const) {}
export class AdminPermissionReadFilterUpdateOperation extends PickType(AdminPermissionOperations, [
  'read',
  'update',
  'filter',
] as const) {}
export class AdminPermissionReadFilterUpdateDeleteOperation extends OmitType(AdminPermissionOperations, [
  'create',
] as const) {}
export class AdminPermissionCreateReadFilterUpdateOperation extends OmitType(AdminPermissionOperations, [
  'delete',
] as const) {}

export class AdminPermissions implements Record<AdminResourcesEnum, Partial<AdminPermissionOperations>> {
  @IsObject()
  @ValidateNested()
  admins: AdminPermissionCreateReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  adminRoles: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  appVersions: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  users: AdminPermissionReadFilterUpdateOperation;

  @IsObject()
  @ValidateNested()
  pets: AdminPermissionReadFilterUpdateOperation;

  @IsObject()
  @ValidateNested()
  petBreeds: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  petTypes: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  posts: AdminPermissionReadFilterUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  comments: AdminPermissionReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  moderationReports: AdminPermissionReadUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  cities: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  countries: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  areas: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  sync: AdminPermissionReadUpdateOperation;

  @IsObject()
  @ValidateNested()
  branchServiceTypes: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  serviceProviders: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  appointments: AdminPermissionReadOperation;

  @IsObject()
  @ValidateNested()
  eventCategories: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  eventFacilities: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  marketing: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  lostFoundPosts: AdminPermissionReadFilterUpdateDeleteOperation;

  @IsObject()
  @ValidateNested()
  topics: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  brands: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  branches: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  medicalSpecialty: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  branchAccessRole: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  products: AdminPermissionOperations;

  @IsObject()
  @ValidateNested()
  productCategories: AdminPermissionOperations;
}
