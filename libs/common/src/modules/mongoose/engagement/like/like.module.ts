import { ModelNames } from '@common/constants';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { CommentMongooseModule } from '../comment';
import { CommentReplyMongooseModule } from '../comment-reply';
import { PostMongooseModule } from '../../post';
import { baseLikeSchemaFactory } from '@common/schemas/mongoose/engagement/like/base-like';
import { CommentLikeEventListener } from '@common/schemas/mongoose/engagement/like/comment-like/comment-like-event-listener';
import { commentLikeSchemaFactory } from '@common/schemas/mongoose/engagement/like/comment-like/comment-like.schema';
import { CommentReplyLikeEventListener } from '@common/schemas/mongoose/engagement/like/comment-reply-like/comment-reply-like-event-listener';
import { commentReplyLikeSchemaFactory } from '@common/schemas/mongoose/engagement/like/comment-reply-like/comment-reply-like.schema';
import { PostLikeEventListener } from '@common/schemas/mongoose/engagement/like/post-like/post-like-event-listener';
import { postLikeSchemaFactory } from '@common/schemas/mongoose/engagement/like/post-like/post-like.schema';

const BaseLikeMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BASE_LIKE,
  inject: [getConnectionToken()],
  useFactory: baseLikeSchemaFactory,
};

const CommentLikeMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.COMMENT_LIKE,
  inject: [ModelNames.BASE_LIKE, EventEmitter2],
  useFactory: commentLikeSchemaFactory,
};

const CommentReplyLikeMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.COMMENT_REPLY_LIKE,
  inject: [ModelNames.BASE_LIKE, EventEmitter2],
  useFactory: commentReplyLikeSchemaFactory,
};

const PostLikeMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.POST_LIKE,
  inject: [ModelNames.BASE_LIKE, EventEmitter2],
  useFactory: postLikeSchemaFactory,
};

const baseLikeProviders = [
  BaseLikeMongooseDynamicModule,
  CommentLikeMongooseDynamicModule,
  CommentReplyLikeMongooseDynamicModule,
  PostLikeMongooseDynamicModule,
  CommentLikeEventListener,
  CommentReplyLikeEventListener,
  PostLikeEventListener,
];

@Module({
  imports: [
    forwardRef(() => CommentMongooseModule),
    forwardRef(() => CommentReplyMongooseModule),
    forwardRef(() => PostMongooseModule),
  ],
  providers: baseLikeProviders,
  exports: baseLikeProviders,
})
export class LikeMongooseModule {}
