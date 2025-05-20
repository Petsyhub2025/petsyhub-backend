import { ModelNames } from '@common/constants';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { PetEventListener } from '@common/schemas/mongoose/pet/pet-event-listener';
import { petSchemaFactory } from '@common/schemas/mongoose/pet/pet.schema';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { RedisService } from '@songkeys/nestjs-redis';
import { MongooseCommonModule } from '@common/modules/mongoose/common';
import { LostFoundMongooseModule } from '@common/modules/mongoose/lost-found';
import { PostMongooseModule } from '@common/modules/mongoose/post';
import { UserMongooseModule } from '@common/modules/mongoose/user/user.module';
import { PendingPetFollowMongooseModule } from './pending-pet-follow';
import { PetFollowMongooseModule } from './pet-follow';
import { PetMatchMongooseModule } from '@common/modules/mongoose/matching/pet-match';

const PetMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PET,
  inject: [
    getConnectionToken(),
    EventEmitter2,
    RedisService,
    AmqpConnection,
    DeepLinkService,
    FirebaseDynamicLinkService,
  ],
  useFactory: petSchemaFactory,
};

const petProviders = [PetMongooseDynamicModule, PetEventListener];

@Module({
  imports: [
    MongooseCommonModule.forRoot(),
    forwardRef(() => UserMongooseModule),
    forwardRef(() => PostMongooseModule),
    forwardRef(() => PetFollowMongooseModule),
    PendingPetFollowMongooseModule,
    forwardRef(() => LostFoundMongooseModule),
    forwardRef(() => PetMatchMongooseModule),
  ],
  providers: petProviders,
  exports: petProviders,
})
export class PetMongooseModule {}
