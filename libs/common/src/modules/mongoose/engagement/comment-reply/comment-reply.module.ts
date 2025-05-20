import { ModelNames } from '@common/constants';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '../../common';
import { CommentMongooseModule } from '../comment/comment.module';
import { LikeMongooseModule } from '../like';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { CommentReplyEventListener } from '@common/schemas/mongoose/engagement/comment-reply/comment-reply-event-listener';
import { commentReplySchemaFactory } from '@common/schemas/mongoose/engagement/comment-reply/comment-reply.schema';

const CommentReplyMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.COMMENT_REPLY,
  inject: [getConnectionToken(), EventEmitter2, DeepLinkService, FirebaseDynamicLinkService],
  useFactory: commentReplySchemaFactory,
};

const commentReplyProviders = [CommentReplyMongooseDynamicModule, CommentReplyEventListener];

@Module({
  imports: [
    MongooseCommonModule.forRoot(),
    forwardRef(() => CommentMongooseModule),
    forwardRef(() => LikeMongooseModule),
  ],
  providers: commentReplyProviders,
  exports: commentReplyProviders,
})
export class CommentReplyMongooseModule {}
