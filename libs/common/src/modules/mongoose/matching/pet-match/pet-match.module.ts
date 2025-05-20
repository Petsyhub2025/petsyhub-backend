import { ModelNames } from '@common/constants';
import { petMatchSchemaFactory } from '@common/schemas/mongoose/matching/pet-match';
import { FactoryProvider, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';

const PetMatchMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PET_MATCH,
  inject: [getConnectionToken(), EventEmitter2],
  useFactory: petMatchSchemaFactory,
};

const petMatchProviders = [PetMatchMongooseDynamicModule];

@Module({
  imports: [],
  providers: petMatchProviders,
  exports: petMatchProviders,
})
export class PetMatchMongooseModule {}
