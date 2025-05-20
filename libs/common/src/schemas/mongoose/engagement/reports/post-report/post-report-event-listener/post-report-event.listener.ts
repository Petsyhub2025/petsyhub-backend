import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { PostReportEventsEnum } from '../post-report.enum';
import { PostReport } from '../post-report.type';
import { IPostModel } from '@common/schemas/mongoose/post/post.type';

@Injectable()
export class PostReportEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.POST)) private postModel: IPostModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(PostReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, { promisify: true })
  async updaterReportCounts(event: HydratedDocument<PostReport>) {
    return this.errorHandler.eventListenerErrorHandler(
      PostReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS,
      async () => {
        await this.postModel.findByIdAndUpdate(event.post, {
          $inc: { totalReports: 1 },
        });
      },
    );
  }

  @OnEvent(PostReportEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteReport(event: HydratedDocument<PostReport>) {
    return this.errorHandler.eventListenerErrorHandler(PostReportEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.post ? [this.postModel.findByIdAndUpdate(event.post, { $inc: { totalReports: -1 } })] : []),
      ]);
    });
  }
}
