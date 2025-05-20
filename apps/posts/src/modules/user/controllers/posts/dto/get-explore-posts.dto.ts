import { BasePaginationQuery } from '@common/dtos';
import { PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetExplorePostsQueryDto extends PickType(BasePaginationQuery, ['limit'] as const) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  afterId?: number;
}
