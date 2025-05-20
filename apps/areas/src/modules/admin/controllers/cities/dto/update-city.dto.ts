import { PartialType, PickType } from '@nestjs/swagger';
import { IsMongoId, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { CreateCityDto } from './create-city.dto';
import { City, LocationDto } from '@instapets-backend/common';

export class UpdateCityDto extends PartialType(PickType(City, ['name', 'country'] as const)) {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  location?: LocationDto;
}
