import { IsOptional, IsString } from 'class-validator';
import { BasePaginationQuery } from './base-pagination.dto';

export class BaseSearchPaginationQuery extends BasePaginationQuery {
  @IsOptional()
  @IsString()
  search?: string;
}
