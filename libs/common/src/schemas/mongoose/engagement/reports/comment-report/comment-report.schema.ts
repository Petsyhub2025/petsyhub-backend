import { ModelNames } from '@common/constants';
import { HydratedDocument, Schema } from 'mongoose';
import { ReportTypeEnum } from '../base-report/base-report.enum';
import { IBaseReportModel } from '../base-report/base-report.type';
import { CommentReport, ICommentReportInstanceMethods, ICommentReportModel } from './comment-report.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommentReportEventsEnum } from './comment-report.enum';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const CommentReportSchema = new Schema<CommentReport, ICommentReportModel, ICommentReportInstanceMethods>(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COMMENT,
      required: true,
    },
  },
  { timestamps: true },
);

export function commentReportSchemaFactory(baseReportModel: IBaseReportModel, eventEmitter: EventEmitter2) {
  CommentReportSchema.pre('validate', async function () {
    await validateSchema(this, CommentReport);
  });

  CommentReportSchema.post('save', async function () {
    if (!this.authorUser) return;

    eventEmitter.emit(CommentReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, this);
  });

  CommentReportSchema.methods.deleteDoc = async function (this: HydratedDocument<CommentReport>) {
    await this.deleteOne();

    eventEmitter.emit(CommentReportEventsEnum.DELETE_DOC, this);
  };

  const commentReportModel = baseReportModel.discriminator(
    ModelNames.COMMENT_REPORT,
    CommentReportSchema,
    ReportTypeEnum.COMMENT,
  );

  return commentReportModel;
}
