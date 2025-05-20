import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetPetsDto extends BaseSearchPaginationQuery {
  @IsMongoId()
  @IsOptional()
  breedId?: string;

  @IsMongoId()
  @IsOptional()
  typeId?: string;

  @IsMongoId()
  @IsOptional()
  userId?: string;
}
