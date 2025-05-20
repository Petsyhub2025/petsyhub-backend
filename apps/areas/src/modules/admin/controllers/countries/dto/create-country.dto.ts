import { PickType } from '@nestjs/swagger';
import { LocationDto, Country } from '@instapets-backend/common';
import { IsObject, ValidateNested } from 'class-validator';

export class CreateCountryBodyDto extends PickType(Country, [
  'countryCode',
  'dialCode',
  'name',
  'countryCurrency',
] as const) {
  @IsObject()
  @ValidateNested()
  location: LocationDto;
}
