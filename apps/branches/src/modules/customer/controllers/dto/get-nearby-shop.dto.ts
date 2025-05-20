import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, ValidateIf } from 'class-validator';

export class GetNearByShopQueryDto {
  @IsNumber()
  @IsLatitude()
  @ValidateIf((o) => o.lng !== undefined)
  @Type(() => Number)
  @ApiProperty({ type: Number, example: 31.20402532134119 })
  lat: number;

  @IsNumber()
  @IsLongitude()
  @ValidateIf((o) => o.latitude !== undefined)
  @Type(() => Number)
  @ApiProperty({ type: Number, example: 29.910899667675583 })
  lng: number;
}
