import { BasePaginationQuery, PetMatch, PetMatchStatusEnum } from '@instapets-backend/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetMatchRequestsQueryDto extends BasePaginationQuery {
  @IsString()
  @IsEnum(PetMatchStatusEnum)
  status: PetMatchStatusEnum;

  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => obj[key] === 'true')
  countOnly?: boolean;
}
