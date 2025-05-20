import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { CommentReplyReportEventsEnum } from '../comment-reply-report.enum';
import { CommentReplyReport } from '../comment-reply-report.type';
import { ICommentReplyModel } from '../../../comment-reply/comment-reply.type';

@Injectable()
export class CommentReplyReportEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.COMMENT_REPLY)) private commentReplyModel: ICommentReplyModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(CommentReplyReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, { promisify: true })
  async updaterReportCounts(event: HydratedDocument<CommentReplyReport>) {
    return this.errorHandler.eventListenerErrorHandler(
      CommentReplyReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS,
      async () => {
        await this.commentReplyModel.findByIdAndUpdate(event.commentReply, {
          $inc: { totalReports: 1 },
        });
      },
    );
  }

  @OnEvent(CommentReplyReportEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteReport(event: HydratedDocument<CommentReplyReport>) {
    return this.errorHandler.eventListenerErrorHandler(CommentReplyReportEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.commentReply
          ? [this.commentReplyModel.findByIdAndUpdate(event.commentReply, { $inc: { totalReports: -1 } })]
          : []),
      ]);
    });
  }
}
