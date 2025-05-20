import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { UserReportEventsEnum } from '../user-report.enum';
import { UserReport } from '../user-report.type';
import { IUserModel } from '@common/schemas/mongoose/user/user.type';

@Injectable()
export class UserReportEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.USER)) private userModel: IUserModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}
  @OnEvent(UserReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, { promisify: true })
  async updaterReportCounts(event: HydratedDocument<UserReport>) {
    return this.errorHandler.eventListenerErrorHandler(
      UserReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS,
      async () => {
        await this.userModel.findByIdAndUpdate(event.user, {
          $inc: { totalReports: 1 },
        });
      },
    );
  }

  @OnEvent(UserReportEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteReport(event: HydratedDocument<UserReport>) {
    return this.errorHandler.eventListenerErrorHandler(UserReportEventsEnum.DELETE_DOC, async () => {
      await Promise.all([
        ...(event.user ? [this.userModel.findByIdAndUpdate(event.user, { $inc: { totalReports: -1 } })] : []),
      ]);
    });
  }
}
