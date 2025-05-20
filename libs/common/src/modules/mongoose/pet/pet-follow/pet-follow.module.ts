import { ModelNames } from '@common/constants';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { PetMongooseModule } from '../pet.module';
import { PetFollowEventListener } from '@common/schemas/mongoose/pet/pet-follow/pet-follow-event-listener';
import { PetFollowHelperService } from '@common/schemas/mongoose/pet/pet-follow/pet-follow-helper.service';
import { petFollowSchemaFactory } from '@common/schemas/mongoose/pet/pet-follow/pet-follow.schema';
import { UserMongooseModule } from '../../user/user.module';

const PetFollowMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PET_FOLLOW,
  inject: [getConnectionToken(), EventEmitter2],
  useFactory: petFollowSchemaFactory,
};

const petFollowProviders = [PetFollowMongooseDynamicModule, PetFollowEventListener, PetFollowHelperService];

@Module({
  imports: [forwardRef(() => UserMongooseModule), forwardRef(() => PetMongooseModule)],
  providers: petFollowProviders,
  exports: petFollowProviders,
})
export class PetFollowMongooseModule {}
