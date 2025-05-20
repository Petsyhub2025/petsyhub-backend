import { BasePaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetMatchesQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsMongoId()
  cityId?: string;

  @IsOptional()
  @IsMongoId()
  petTypeId?: string;
}
