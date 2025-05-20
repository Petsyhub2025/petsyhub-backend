import { IsMongoId } from 'class-validator';

export class PetIdParamDto {
  @IsMongoId()
  petId: string;
}
