import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class ServiceProvider extends BaseModel<ServiceProvider> {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @IsPhoneNumber()
  @IsOptional()
  anotherPhoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  isSelfResetPassword?: boolean;
}

export interface IServiceProviderInstanceMethods extends IBaseInstanceMethods {
  comparePassword(password: string): Promise<boolean>;
}
export interface IServiceProviderModel
  extends Model<ServiceProvider, Record<string, unknown>, IServiceProviderInstanceMethods> {}
