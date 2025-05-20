import { IsMongoId } from 'class-validator';

export class GetAreasFilterOptionsQueryDto {
  @IsMongoId()
  cityId: string;
}
