import { IsMongoId } from 'class-validator';

export class CityIdParamDto {
  @IsMongoId()
  cityId: string;
}
