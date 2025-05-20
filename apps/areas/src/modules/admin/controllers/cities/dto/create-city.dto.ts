import { ApiProperty, PickType } from '@nestjs/swagger';
import { City, LocationDto, TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCityDto extends PickType(City, ['name'] as const) {
  @IsObject()
  @ValidateNested()
  location: LocationDto;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  countryId: Types.ObjectId;
}
