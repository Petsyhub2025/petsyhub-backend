import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetCitiesQueryDto extends BaseSearchPaginationQuery {
  @IsMongoId()
  @IsOptional()
  countryId?: string;
}
