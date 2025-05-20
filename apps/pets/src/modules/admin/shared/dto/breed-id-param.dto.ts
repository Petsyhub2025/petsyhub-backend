import { IsMongoId } from 'class-validator';

export class BreedIdParamDto {
  @IsMongoId()
  breedId: string;
}
