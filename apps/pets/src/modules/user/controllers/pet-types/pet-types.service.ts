import { Inject, Injectable } from '@nestjs/common';
import { IPetTypeModel, ModelNames } from '@instapets-backend/common';

@Injectable()
export class PetTypesService {
  constructor(@Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPetTypes(userId: string) {
    const petTypes = await this.petTypeModel.find(
      {},
      {
        _id: 1,
        name: 1,
      },
    );
    return petTypes;
  }
}
