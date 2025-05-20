import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { PointLocation } from '@common/schemas/mongoose/common/point';
import { CountryName } from './country-name';
import { CountryDialCodesEnum, CountryCodesEnum, CountryCurrenciesEnum } from './country.enum';
import { IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class Country extends BaseModel<Country> {
  @IsObject()
  @ValidateNested()
  name: CountryName;

  @IsString()
  @IsEnum(CountryDialCodesEnum)
  dialCode: CountryDialCodesEnum;

  @IsString()
  @IsEnum(CountryCodesEnum)
  countryCode: CountryCodesEnum;

  @IsObject()
  @ValidateNested()
  location: PointLocation;

  @IsOptional()
  @IsString()
  @IsEnum(CountryCurrenciesEnum)
  countryCurrency?: CountryCurrenciesEnum;
}
export interface ICountryInstanceMethods extends IBaseInstanceMethods {}
export interface ICountryModel extends Model<Country, Record<string, unknown>, ICountryInstanceMethods> {}
