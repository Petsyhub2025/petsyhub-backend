import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { PointLocation } from '../point';
import { LocalizedText } from '../localized-text';

export class GooglePlacesLocation {
  @IsObject()
  @ValidateNested()
  location: PointLocation;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  address?: LocalizedText;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  city: Types.ObjectId;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  area?: LocalizedText;

  @IsString()
  googlePlaceId: string;
}
