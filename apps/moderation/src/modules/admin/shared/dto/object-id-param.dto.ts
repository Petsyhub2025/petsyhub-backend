import { IsMongoId } from 'class-validator';

export class ObjectIdParamDto {
  @IsMongoId()
  objectId: string;
}
