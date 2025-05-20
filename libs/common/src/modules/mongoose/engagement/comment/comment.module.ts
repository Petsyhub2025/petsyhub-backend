import { ModelNames } from '@common/constants';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '../../common';
import { PostMongooseModule } from '../../post';
import { CommentReplyMongooseModule } from '../comment-reply';
import { LikeMongooseModule } from '../like';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { CommentEventListener } from '@common/schemas/mongoose/engagement/comment/comment-event-listener';
import { commentSchemaFactory } from '@common/schemas/mongoose/engagement/comment/comment.schema';

const CommentMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.COMMENT,
  inject: [getConnectionToken(), EventEmitter2, DeepLinkService, FirebaseDynamicLinkService],
  useFactory: commentSchemaFactory,
};

const commentProviders = [CommentMongooseDynamicModule, CommentEventListener];

@Module({
  imports: [
    MongooseCommonModule.forRoot(),
    forwardRef(() => PostMongooseModule),
    forwardRef(() => LikeMongooseModule),
    forwardRef(() => CommentReplyMongooseModule),
  ],
  providers: commentProviders,
  exports: commentProviders,
})
export class CommentMongooseModule {}
