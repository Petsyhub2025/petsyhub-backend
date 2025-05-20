import { ModelNames } from '@common/constants';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { CommentMongooseModule } from '../comment';
import { CommentReplyMongooseModule } from '../comment-reply';
import { PostMongooseModule } from '../../post';
import { baseReportSchemaFactory } from '@common/schemas/mongoose/engagement/reports/base-report';
import { CommentReplyReportEventListener } from '@common/schemas/mongoose/engagement/reports/comment-reply-report/comment-reply-report-event-listener';
import { commentReplyReportSchemaFactory } from '@common/schemas/mongoose/engagement/reports/comment-reply-report/comment-reply-report.schema';
import { CommentReportEventListener } from '@common/schemas/mongoose/engagement/reports/comment-report/comment-report-event-listener';
import { commentReportSchemaFactory } from '@common/schemas/mongoose/engagement/reports/comment-report/comment-report.schema';
import { PostReportEventListener } from '@common/schemas/mongoose/engagement/reports/post-report/post-report-event-listener';
import { postReportSchemaFactory } from '@common/schemas/mongoose/engagement/reports/post-report/post-report.schema';
import { UserReportEventListener } from '@common/schemas/mongoose/engagement/reports/user-report/user-report-event-listener';
import { userReportSchemaFactory } from '@common/schemas/mongoose/engagement/reports/user-report/user-report.schema';
import { UserMongooseModule } from '../../user/user.module';

const BaseReportMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BASE_REPORT,
  inject: [getConnectionToken()],
  useFactory: baseReportSchemaFactory,
};

const CommentReportMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.COMMENT_REPORT,
  inject: [ModelNames.BASE_REPORT, EventEmitter2],
  useFactory: commentReportSchemaFactory,
};

const CommentReplyReportMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.COMMENT_REPLY_REPORT,
  inject: [ModelNames.BASE_REPORT, EventEmitter2],
  useFactory: commentReplyReportSchemaFactory,
};

const PostReportMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.POST_REPORT,
  inject: [ModelNames.BASE_REPORT, EventEmitter2],
  useFactory: postReportSchemaFactory,
};

const UserReportMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_REPORT,
  inject: [ModelNames.BASE_REPORT, EventEmitter2],
  useFactory: userReportSchemaFactory,
};

const baseReportProviders = [
  BaseReportMongooseDynamicModule,
  CommentReportMongooseDynamicModule,
  CommentReplyReportMongooseDynamicModule,
  UserReportMongooseDynamicModule,
  PostReportMongooseDynamicModule,
  CommentReportEventListener,
  CommentReplyReportEventListener,
  PostReportEventListener,
  UserReportEventListener,
];

@Module({
  imports: [
    forwardRef(() => CommentMongooseModule),
    forwardRef(() => CommentReplyMongooseModule),
    forwardRef(() => PostMongooseModule),
    forwardRef(() => UserMongooseModule),
  ],
  providers: baseReportProviders,
  exports: baseReportProviders,
})
export class ReportMongooseModule {}
