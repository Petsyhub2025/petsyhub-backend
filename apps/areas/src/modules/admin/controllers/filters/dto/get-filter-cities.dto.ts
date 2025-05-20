import { IsMongoId } from 'class-validator';

export class GetCitiesFilterOptionsQueryDto {
  @IsMongoId()
  countryId: string;
}
