import { ModelNames } from '@common/constants';
import { pendingPetFollowSchemaFactory } from '@common/schemas/mongoose/pet/pending-pet-follow';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const PendingPetFollowMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PENDING_PET_FOLLOW,
  inject: [getConnectionToken()],
  useFactory: pendingPetFollowSchemaFactory,
};

const petFollowProviders = [PendingPetFollowMongooseDynamicModule];

@Module({
  imports: [],
  providers: petFollowProviders,
  exports: petFollowProviders,
})
export class PendingPetFollowMongooseModule {}
