import { ModelNames } from '@common/constants';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { UserEventListener } from '@common/schemas/mongoose/user/user-event-listener';
import { UserHelperService } from '@common/schemas/mongoose/user/user-helper.service';
import { userSchemaFactory } from '@common/schemas/mongoose/user/user.schema';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { RedisService } from '@songkeys/nestjs-redis';
import { AppointmentMongooseModule } from '@common/modules/mongoose/appointment/appointment.module';
import { MongooseCommonModule } from '@common/modules/mongoose/common';
import { CommentMongooseModule } from '@common/modules/mongoose/engagement/comment/comment.module';
import { CommentReplyMongooseModule } from '@common/modules/mongoose/engagement/comment-reply/comment-reply.module';
import { LostFoundMongooseModule } from '@common/modules/mongoose/lost-found/lost-found.module';
import { PetFollowMongooseModule } from '@common/modules/mongoose/pet/pet-follow/pet-follow.module';
import { PetMongooseModule } from '@common/modules/mongoose/pet/pet.module';
import { PostMongooseModule } from '@common/modules/mongoose/post/post.module';
import { PendingUserFollowMongooseModule } from './pending-user-follow';
import { UserFollowMongooseModule } from './user-follow';
import { PendingPetFollowMongooseModule } from '@common/modules/mongoose/pet/pending-pet-follow';
import { PetMatchMongooseModule } from '@common/modules/mongoose/matching/pet-match';
import { EventMongooseModule } from '@common/modules/mongoose/event/event.module';

const UserMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER,
  inject: [
    getConnectionToken(),
    UserHelperService,
    EventEmitter2,
    DeepLinkService,
    FirebaseDynamicLinkService,
    RedisService,
    AmqpConnection,
  ],
  useFactory: userSchemaFactory,
};

const userProviders = [UserMongooseDynamicModule, UserHelperService, UserEventListener];

@Module({
  imports: [
    MongooseCommonModule.forRoot(),
    forwardRef(() => PostMongooseModule),
    forwardRef(() => PetMongooseModule),
    forwardRef(() => CommentMongooseModule),
    forwardRef(() => CommentReplyMongooseModule),
    forwardRef(() => UserFollowMongooseModule),
    forwardRef(() => PetFollowMongooseModule),
    forwardRef(() => PendingUserFollowMongooseModule),
    forwardRef(() => PendingPetFollowMongooseModule),
    forwardRef(() => AppointmentMongooseModule),
    forwardRef(() => LostFoundMongooseModule),
    forwardRef(() => PetMatchMongooseModule),
    forwardRef(() => EventMongooseModule),
  ],
  providers: userProviders,
  exports: userProviders,
})
export class UserMongooseModule {}
