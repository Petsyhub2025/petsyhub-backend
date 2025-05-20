import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { CommentReportEventsEnum } from '../comment-report.enum';
import { CommentReport } from '../comment-report.type';
import { ICommentModel } from '../../../comment/comment.type';

@Injectable()
export class CommentReportEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.COMMENT)) private commentModel: ICommentModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(CommentReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, { promisify: true })
  async updaterReportCounts(event: HydratedDocument<CommentReport>) {
    return this.errorHandler.eventListenerErrorHandler(
      CommentReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS,
      async () => {
        await this.commentModel.findByIdAndUpdate(event.comment, {
          $inc: { totalReports: 1 },
        });
      },
    );
  }

  @OnEvent(CommentReportEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteReport(event: HydratedDocument<CommentReport>) {
    return this.errorHandler.eventListenerErrorHandler(CommentReportEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.comment ? [this.commentModel.findByIdAndUpdate(event.comment, { $inc: { totalReports: -1 } })] : []),
      ]);
    });
  }
}
