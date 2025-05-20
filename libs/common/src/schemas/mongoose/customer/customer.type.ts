import { TransformObjectId } from '@common/decorators/class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInstance,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Model, Types } from 'mongoose';
import { UserGenderEnum, UserRoleEnum } from '@common/schemas/mongoose/user/user.enum';
import { OwnedPetsSubSchemaType } from '@common/schemas/mongoose/user/user-subschemas/owned-pets';
import { CustomerDevicesSubSchemaType } from './subschemas/customer-devices';
import { CustomerSettingsSubSchemaType } from './subschemas/customer-settings';

const nameRegex = /^[^\d!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]+$/;

export class Customer extends BaseModel<Customer> {
  @IsString()
  @IsNotEmpty()
  @Matches(nameRegex)
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(nameRegex)
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsMobilePhone()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  appleId?: string;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  socialAccountId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  stripeCustomerId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(UserGenderEnum)
  gender?: UserGenderEnum;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  activeAddress?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => OwnedPetsSubSchemaType)
  ownedPets?: OwnedPetsSubSchemaType[];

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => CustomerDevicesSubSchemaType)
  devices?: CustomerDevicesSubSchemaType[];

  @IsOptional()
  @ValidateNested()
  settings?: CustomerSettingsSubSchemaType;

  @IsOptional()
  @IsNumber()
  totalOrders?: number = 0;
}

export interface ICustomerInstanceMethods extends IBaseInstanceMethods {
  comparePassword(password: string): Promise<boolean>;
}
export interface ICustomerModel extends Model<Customer, Record<string, unknown>, ICustomerInstanceMethods> {}
