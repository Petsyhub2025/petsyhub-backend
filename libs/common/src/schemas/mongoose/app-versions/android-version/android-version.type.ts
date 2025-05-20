import { IsObject, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseVersionSubSchemaType } from '../base-version/base-version-sub-schemas/base-version';
import { BaseVersion, IBaseVersionInstanceMethods } from '../base-version/base-version.type';

export class AndroidVersion extends BaseVersion {
  @IsObject()
  @ValidateNested()
  androidVersion: BaseVersionSubSchemaType;
}

export interface IAndroidVersionInstanceMethods extends IBaseVersionInstanceMethods {}
export interface IAndroidVersionModel
  extends Model<AndroidVersion, Record<string, unknown>, IAndroidVersionInstanceMethods> {}
