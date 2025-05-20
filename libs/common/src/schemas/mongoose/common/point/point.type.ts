import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class PointLocation {
  @IsString()
  type: 'Point';

  @IsArray()
  @ArrayNotEmpty()
  coordinates: number[];
}
