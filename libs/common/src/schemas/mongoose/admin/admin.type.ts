import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '../base/base-schema';
import { AdminPermissions } from './admin-permissions';
import { AdminRoleSubSchemaType } from './admin-subschemas/admin-role';
import { AdminSettingsSubSchemaType } from './admin-subschemas/admin-settings';

export class Admin extends BaseModel<Admin> {
  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  googleId?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsObject()
  @ValidateNested()
  permissions: AdminPermissions;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  settings: AdminSettingsSubSchemaType;

  @IsObject()
  @ValidateNested()
  role: AdminRoleSubSchemaType;
}

export interface IAdminInstanceMethods extends IBaseInstanceMethods {}
export interface IAdminModel extends Model<Admin, Record<string, unknown>, IAdminInstanceMethods> {}
