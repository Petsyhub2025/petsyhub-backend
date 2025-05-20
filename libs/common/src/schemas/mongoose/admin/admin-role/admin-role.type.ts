import { IsString } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class AdminRole extends BaseModel {
  @IsString()
  name: string;
}

export interface IAdminRoleInstanceMethods extends IBaseInstanceMethods {}
export interface IAdminRoleModel extends Model<AdminRole, Record<string, unknown>, IAdminRoleInstanceMethods> {}
