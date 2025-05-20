import { GooglePlacesLocation } from '@common/schemas/mongoose/common/google-places-location';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class EventPlaceLocationSubSchemaType {
  @IsObject()
  @ValidateNested()
  locationData: GooglePlacesLocation;

  @IsOptional()
  @IsString()
  extraAddressDetails?: string;
}
