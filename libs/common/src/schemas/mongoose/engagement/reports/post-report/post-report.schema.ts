import { ModelNames } from '@common/constants';
import { HydratedDocument, Schema } from 'mongoose';
import { ReportTypeEnum } from '../base-report/base-report.enum';
import { IBaseReportModel } from '../base-report/base-report.type';
import { IPostReportInstanceMethods, IPostReportModel, PostReport } from './post-report.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostReportEventsEnum } from './post-report.enum';

const PostReportSchema = new Schema<PostReport, IPostReportModel, IPostReportInstanceMethods>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.POST,
      required: true,
    },
  },
  { timestamps: true },
);

export function postReportSchemaFactory(baseReportModel: IBaseReportModel, eventEmitter: EventEmitter2) {
  PostReportSchema.pre('validate', async function () {
    await validateSchema(this, PostReport);
  });

  PostReportSchema.post('save', async function () {
    if (!this.authorUser) return;

    eventEmitter.emit(PostReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, this);
  });

  PostReportSchema.methods.deleteDoc = async function (this: HydratedDocument<PostReport>) {
    await this.deleteOne();

    eventEmitter.emit(PostReportEventsEnum.DELETE_DOC, this);
  };
  const postReportModel = baseReportModel.discriminator(ModelNames.POST_REPORT, PostReportSchema, ReportTypeEnum.POST);

  return postReportModel;
}
