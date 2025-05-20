import { IsNumber, IsObject, IsOptional, IsPositive, Min, ValidateIf, ValidateNested } from 'class-validator';

export class VersionType {
  @IsNumber()
  @IsPositive()
  major: number;

  @IsNumber()
  @Min(0)
  minor: number;

  @IsNumber()
  @Min(0)
  patch: number;
}
export class DeviceVersionSubSchemaType {
  @ValidateIf((o) => !!o.min || o.max == undefined)
  @IsObject()
  @ValidateNested()
  min?: VersionType;

  @ValidateIf((o) => !!o.max || o.min == undefined)
  @IsObject()
  @ValidateNested()
  max?: VersionType;
}
