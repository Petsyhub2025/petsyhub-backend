import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetBreedsQueryDto extends BaseSearchPaginationQuery {
  @IsMongoId()
  @IsOptional()
  typeId?: string;
}
