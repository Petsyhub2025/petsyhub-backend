import { ApiProperty, PickType } from '@nestjs/swagger';
import { Area, LocationDto, TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

export class CreateAreaDto extends PickType(Area, ['name'] as const) {
  @IsObject()
  @ValidateNested()
  location: LocationDto;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  cityId: Types.ObjectId;
}
