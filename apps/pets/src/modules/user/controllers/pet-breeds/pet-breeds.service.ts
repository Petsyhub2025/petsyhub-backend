import { Inject, Injectable } from '@nestjs/common';
import { GetPetBreedsQueryDto } from './dto/get-pet-breeds.dto';
import { IPetBreedModel, ModelNames } from '@instapets-backend/common';

@Injectable()
export class PetBreedsService {
  constructor(@Inject(ModelNames.PET_BREED) private petBreedModel: IPetBreedModel) {}

  async getPetBreeds(userId: string, { typeId }: GetPetBreedsQueryDto) {
    const petBreeds = await this.petBreedModel.find(
      { type: typeId },
      {
        _id: 1,
        name: 1,
      },
    );
    return petBreeds;
  }
}
