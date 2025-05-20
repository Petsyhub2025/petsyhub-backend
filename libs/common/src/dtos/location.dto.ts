import { IsLatitude, IsLongitude, IsNumber } from 'class-validator';

export class LocationDto {
  @IsNumber()
  @IsLatitude()
  lat: number;

  @IsNumber()
  @IsLongitude()
  lng: number;
}
