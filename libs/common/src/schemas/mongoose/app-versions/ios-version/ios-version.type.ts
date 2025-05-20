import { Model } from 'mongoose';

import { IsObject, ValidateNested } from 'class-validator';
import { BaseVersionSubSchemaType } from '../base-version/base-version-sub-schemas/base-version';
import { BaseVersion, IBaseVersionInstanceMethods } from '../base-version/base-version.type';

export class IosVersion extends BaseVersion {
  @IsObject()
  @ValidateNested()
  iosVersion: BaseVersionSubSchemaType;
}

export interface IIosVersionInstanceMethods extends IBaseVersionInstanceMethods {}
export interface IIosVersionModel extends Model<IosVersion, Record<string, unknown>, IIosVersionInstanceMethods> {}
