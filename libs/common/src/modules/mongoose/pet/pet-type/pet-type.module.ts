import { ModelNames } from '@common/constants';
import { petTypeSchemaFactory } from '@common/schemas/mongoose/pet/pet-type';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const PetTypeMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PET_TYPE,
  inject: [getConnectionToken()],
  useFactory: petTypeSchemaFactory,
};

const petTypeProviders = [PetTypeMongooseDynamicModule];

@Module({
  imports: [],
  providers: petTypeProviders,
  exports: petTypeProviders,
})
export class PetTypeMongooseModule {}
