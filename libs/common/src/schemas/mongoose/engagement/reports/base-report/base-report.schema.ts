import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { Connection, Schema } from 'mongoose';
import { ReportReasonEnum, ReportStatusEnum } from './base-report.enum';
import { BaseReport, IBaseReportInstanceMethods, IBaseReportModel } from './base-report.type';

const BaseReportSchema = new Schema<BaseReport, IBaseReportModel, IBaseReportInstanceMethods>(
  {
    authorUser: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },
    reason: {
      type: String,
      enum: ReportReasonEnum,
      required: true,
    },

    status: {
      type: String,
      default: ReportStatusEnum.PENDING,
    },

    /*** Base Schema Fields ***/

    ...BaseSchema,
  },
  {
    discriminatorKey: 'reportType',
    timestamps: true,
  },
);

export function baseReportSchemaFactory(connection: Connection) {
  BaseReportSchema.index({ authorUser: 1, post: 1, status: 1 });
  BaseReportSchema.index({ authorUser: 1, comment: 1, status: 1 });
  BaseReportSchema.index({ authorUser: 1, commentReply: 1, status: 1 });
  BaseReportSchema.index({ authorUser: 1, user: 1, status: 1 });
  BaseReportSchema.index({ status: 1 });
  BaseReportSchema.index({ reportType: 1 });
  BaseReportSchema.index({ reportType: 1, status: 1 });

  BaseReportSchema.pre('validate', async function () {
    await validateSchema(this, BaseReport);
  });

  const baseReportModel = connection.model(ModelNames.BASE_REPORT, BaseReportSchema);

  return baseReportModel;
}
