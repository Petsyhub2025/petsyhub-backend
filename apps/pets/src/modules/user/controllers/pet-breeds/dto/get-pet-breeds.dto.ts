import { IsMongoId } from 'class-validator';

export class GetPetBreedsQueryDto {
  @IsMongoId()
  typeId: string;
}
