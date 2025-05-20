import { IsMongoId } from 'class-validator';

export class GetAreasQueryDto {
  @IsMongoId()
  cityId: string;
}
