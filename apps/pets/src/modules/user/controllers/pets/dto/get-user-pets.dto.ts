import { BasePaginationQuery } from '@instapets-backend/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';

export class GetUserPetsQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => obj[key] === 'true')
  isPrivate?: boolean;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  excludePetId?: string;
}
