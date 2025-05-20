import { IsBoolean, IsDate, IsOptional, IsUrl } from 'class-validator';
import { ClientSession } from 'mongoose';

export class BaseModel<T = any> {
  constructor(data: T) {
    Object.assign(this, data);
  }

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  wasNew?: boolean;

  @IsOptional()
  @IsBoolean()
  hasElasticFieldUpdate?: boolean;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date;

  @IsOptional()
  @IsDate()
  suspendedAt?: Date;

  @IsOptional()
  @IsDate()
  suspendedDueToUserSuspensionAt?: Date;

  @IsOptional()
  @IsBoolean()
  isViewable?: boolean;

  @IsOptional()
  @IsUrl()
  dynamicLink?: string;
}

export interface IBaseInstanceMethods {
  deleteDoc: (session?: ClientSession) => Promise<void>;
  suspendDoc: () => Promise<void>;
  suspendDocDueToUserSuspension: () => Promise<void>;
  unSuspendDoc: () => Promise<void>;
  unSuspendDocDueToUserSuspension: () => Promise<void>;
  _unSuspendDoc: () => Promise<void>;
}
