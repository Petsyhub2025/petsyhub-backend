import { BasePaginationQuery, FavoriteTypeEnum } from '@instapets-backend/common';
import { IsString, IsLatitude, IsLongitude, IsNumber, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetFavoritesQueryDto extends BasePaginationQuery {
  @IsString()
  favoriteType: FavoriteTypeEnum;
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
