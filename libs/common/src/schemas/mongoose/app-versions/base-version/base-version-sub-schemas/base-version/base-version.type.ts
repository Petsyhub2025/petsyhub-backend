import { IsNumber, IsObject, IsPositive, Min, ValidateNested } from 'class-validator';

export class VersionSubSchemaType {
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
export class BaseVersionSubSchemaType {
  @IsObject()
  @ValidateNested()
  min: VersionSubSchemaType;

  @IsObject()
  @ValidateNested()
  max: VersionSubSchemaType;
}
