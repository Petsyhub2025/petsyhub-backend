import { ApiProperty } from '@nestjs/swagger';
import { VERSIONING_REGEX, VersionType } from '@instapets-backend/common';
import { IsEnum, IsString, Matches } from 'class-validator';

export class GetAppVersionQueryDto {
  @IsEnum(VersionType)
  @IsString()
  platform: VersionType;

  @IsString()
  @Matches(VERSIONING_REGEX)
  @ApiProperty({
    type: String,
    example: '1.0.0',
    pattern: VERSIONING_REGEX.toString().replace(/\//g, ''),
  })
  version: string;
}
