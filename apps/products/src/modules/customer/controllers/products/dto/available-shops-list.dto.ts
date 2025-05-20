import { BasePaginationQuery } from '@common/dtos';
import { ApiProperty } from '@nestjs/swagger';
import { SortingByPriceEnum } from '@products/customer/shared/enums/sorting-keys.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class AvailableShopsForProductDto extends BasePaginationQuery {
  @IsOptional()
  @IsString()
  @IsEnum(SortingByPriceEnum)
  sortByPrice?: SortingByPriceEnum;

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
