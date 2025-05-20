import { IsMongoId, IsOptional } from 'class-validator';

export class GetCitiesQueryDto {
  @IsMongoId()
  @IsOptional()
  countryId?: string;
}
