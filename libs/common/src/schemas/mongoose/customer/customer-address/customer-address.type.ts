import { TransformObjectId } from '@common/decorators/class-transformer';
import {
  IsInstance,
  IsOptional,
  IsObject,
  ValidateNested,
  IsString,
  MinLength,
  IsNotEmpty,
  IsNumber,
  IsMobilePhone,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { PointLocation } from '@common/schemas/mongoose/common/point';
import { CustomerAddressTypeEnum } from './customer-address.enum';

export class CustomerAddress extends BaseModel<CustomerAddress> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  city: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  area?: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  location: PointLocation;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  streetName: string;

  @IsMobilePhone(null, { strictMode: true })
  phoneNumber: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  customer: Types.ObjectId;

  @IsOptional()
  @IsString()
  buildingName?: string;

  @IsOptional()
  @IsNumber()
  apartmentNumber?: number;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsString()
  landMark?: string;

  @IsOptional()
  @IsString()
  labelName?: string;

  @IsOptional()
  @IsString()
  houseName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsEnum(CustomerAddressTypeEnum)
  @IsString()
  addressType: CustomerAddressTypeEnum;
}

export interface ICustomerAddressInstanceMethods extends IBaseInstanceMethods {}
export interface ICustomerAddressModel
  extends Model<CustomerAddress, Record<string, unknown>, ICustomerAddressInstanceMethods> {}
