import { IsMongoId } from 'class-validator';

export class AreaIdParamDto {
  @IsMongoId()
  areaId: string;
}
