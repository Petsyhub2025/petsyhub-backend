import { IsMongoId } from 'class-validator';

export class GetCitiesQueryDto {
  @IsMongoId()
  countryId: string;
}
