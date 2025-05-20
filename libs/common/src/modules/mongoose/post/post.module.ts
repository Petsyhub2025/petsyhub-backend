import { ModelNames } from '@common/constants';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { PostEventListener } from '@common/schemas/mongoose/post/post-event-listener';
import { postSchemaFactory } from '@common/schemas/mongoose/post/post.schema';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { RedisService } from '@songkeys/nestjs-redis';
import { MongooseCommonModule } from '../common';
import { CommentMongooseModule } from '../engagement/comment';
import { LikeMongooseModule } from '../engagement/like';
import { PetMongooseModule } from '../pet/pet.module';
import { UserMongooseModule } from '../user/user.module';

const PostMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.POST,
  inject: [
    getConnectionToken(),
    EventEmitter2,
    DeepLinkService,
    FirebaseDynamicLinkService,
    RedisService,
    AmqpConnection,
  ],
  useFactory: postSchemaFactory,
};

const postProviders = [PostMongooseDynamicModule, PostEventListener];

@Module({
  imports: [
    MongooseCommonModule.forRoot(),
    forwardRef(() => UserMongooseModule),
    forwardRef(() => PetMongooseModule),
    forwardRef(() => CommentMongooseModule),
    forwardRef(() => LikeMongooseModule),
  ],
  providers: postProviders,
  exports: postProviders,
})
export class PostMongooseModule {}
