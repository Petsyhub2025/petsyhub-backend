import { BasePaginationQuery, VersionType } from '@instapets-backend/common';
import { IsEnum, IsString } from 'class-validator';

export class GetVersionsQueryDto extends BasePaginationQuery {
  @IsEnum(VersionType)
  @IsString()
  platform: VersionType;
}
