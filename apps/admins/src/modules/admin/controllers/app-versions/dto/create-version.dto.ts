import { ApiProperty, PickType } from '@nestjs/swagger';
import { BaseVersion, VERSIONING_REGEX, VersionType } from '@instapets-backend/common';
import { IsEnum, IsString, Matches } from 'class-validator';

export class CreateVersionQueryDto {
  @IsEnum(VersionType)
  @IsString()
  platform: VersionType;
}

export class CreateVersionDto extends PickType(BaseVersion, ['backendVersions'] as const) {
  @IsString()
  @Matches(VERSIONING_REGEX)
  @ApiProperty({
    type: String,
    example: '1.0.0',
    pattern: VERSIONING_REGEX.toString().replace(/\//g, ''),
  })
  minVersion: string;

  @IsString()
  @Matches(VERSIONING_REGEX)
  @ApiProperty({
    type: String,
    example: '1.0.0',
    pattern: VERSIONING_REGEX.toString().replace(/\//g, ''),
  })
  maxVersion: string;
}
