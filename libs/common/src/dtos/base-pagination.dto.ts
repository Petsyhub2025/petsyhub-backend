import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class BasePaginationQuery {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
