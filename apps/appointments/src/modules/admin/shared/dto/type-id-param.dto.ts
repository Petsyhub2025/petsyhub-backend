import { IsMongoId } from 'class-validator';

export class TypeIdParamDto {
  @IsMongoId()
  typeId: string;
}
