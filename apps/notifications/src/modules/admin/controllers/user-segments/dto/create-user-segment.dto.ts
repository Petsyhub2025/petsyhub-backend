import { UserSegment, UserSegmentDeviceSubSchemaType, VERSIONING_REGEX } from '@instapets-backend/common';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsString, Matches, ValidateIf, IsObject, ValidateNested, IsOptional } from 'class-validator';

export class VersionRangeDto {
  @ValidateIf((o) => !!o.min || o.max == undefined)
  @IsString()
  @Matches(VERSIONING_REGEX)
  @ApiProperty({
    type: String,
    example: '1.0.0',
    pattern: VERSIONING_REGEX.toString().replace(/\//g, ''),
  })
  min?: string;

  @ValidateIf((o) => !!o.max || o.min == undefined)
  @IsString()
  @Matches(VERSIONING_REGEX)
  @ApiProperty({
    type: String,
    example: '1.0.0',
    pattern: VERSIONING_REGEX.toString().replace(/\//g, ''),
  })
  max?: string;
}

export class UserSegmentDeviceDto {
  @ValidateIf((o) => !!o.android || o.ios == undefined)
  @IsObject()
  @ValidateNested()
  android?: VersionRangeDto;

  @ValidateIf((o) => !!o.ios || o.android == undefined)
  @IsObject()
  @ValidateNested()
  ios?: VersionRangeDto;
}

export class CreateUserSegmentDto extends PickType(UserSegment, [
  'title',
  'description',
  'petStatuses',
  'petTypes',
  'hasAttendedEvents',
  'hasHostedEvents',
  'locations',
  'totalFollowers',
  'totalPets',
  'age',
] as const) {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  devices?: UserSegmentDeviceDto;
}
