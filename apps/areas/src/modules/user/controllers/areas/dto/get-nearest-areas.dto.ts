import { IsLatitude, IsLongitude, IsNumber } from 'class-validator';

export class GetNearestAreasQueryDto {
  @IsNumber()
  @IsLongitude()
  lng: number;

  @IsNumber()
  @IsLatitude()
  lat: number;
}
