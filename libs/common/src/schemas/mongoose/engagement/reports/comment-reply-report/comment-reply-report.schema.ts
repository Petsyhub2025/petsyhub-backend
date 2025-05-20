import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HydratedDocument, Schema } from 'mongoose';
import { IBaseReportModel } from '../base-report';
import { ReportTypeEnum } from '../base-report/base-report.enum';
import { CommentReplyReportEventsEnum } from './comment-reply-report.enum';
import {
  CommentReplyReport,
  ICommentReplyReportInstanceMethods,
  ICommentReplyReportModel,
} from './comment-reply-report.type';

const CommentReplyReportSchema = new Schema<
  CommentReplyReport,
  ICommentReplyReportModel,
  ICommentReplyReportInstanceMethods
>(
  {
    commentReply: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COMMENT_REPLY,
      required: true,
    },
  },
  { timestamps: true },
);

export function commentReplyReportSchemaFactory(baseReportModel: IBaseReportModel, eventEmitter: EventEmitter2) {
  CommentReplyReportSchema.pre('validate', async function () {
    await validateSchema(this, CommentReplyReport);
  });

  CommentReplyReportSchema.post('save', async function () {
    if (!this.authorUser) return;

    eventEmitter.emit(CommentReplyReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, this);
  });

  CommentReplyReportSchema.methods.deleteDoc = async function (this: HydratedDocument<CommentReplyReport>) {
    await this.deleteOne();

    eventEmitter.emit(CommentReplyReportEventsEnum.DELETE_DOC, this);
  };

  const commentReplyReportModel = baseReportModel.discriminator(
    ModelNames.COMMENT_REPLY_REPORT,
    CommentReplyReportSchema,
    ReportTypeEnum.COMMENT_REPLY,
  );

  return commentReplyReportModel;
}
