import { IsMongoId } from 'class-validator';

export class CountryIdParamDto {
  @IsMongoId()
  countryId: string;
}
