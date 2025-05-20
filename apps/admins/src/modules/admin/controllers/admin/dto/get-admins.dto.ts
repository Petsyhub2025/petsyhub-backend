import { BaseSearchPaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetAdminsQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  roleId?: string;
}
