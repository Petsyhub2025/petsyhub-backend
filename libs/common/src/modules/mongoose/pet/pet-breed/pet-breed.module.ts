import { ModelNames } from '@common/constants';
import { petBreedSchemaFactory } from '@common/schemas/mongoose/pet/pet-breed';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const PetBreedMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PET_BREED,
  inject: [getConnectionToken()],
  useFactory: petBreedSchemaFactory,
};

const petBreedProviders = [PetBreedMongooseDynamicModule];

@Module({
  imports: [],
  providers: petBreedProviders,
  exports: petBreedProviders,
})
export class PetBreedMongooseModule {}
