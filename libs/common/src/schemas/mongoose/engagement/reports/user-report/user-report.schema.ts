import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HydratedDocument, Schema } from 'mongoose';
import { ReportTypeEnum } from '../base-report/base-report.enum';
import { IBaseReportModel } from '../base-report/base-report.type';
import { IUserReportInstanceMethods, IUserReportModel, UserReport } from './user-report.type';
import { UserReportEventsEnum } from './user-report.enum';

const UserReportSchema = new Schema<UserReport, IUserReportModel, IUserReportInstanceMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },
  },
  { timestamps: true },
);

export function userReportSchemaFactory(baseReportModel: IBaseReportModel, eventEmitter: EventEmitter2) {
  UserReportSchema.pre('validate', async function () {
    await validateSchema(this, UserReport);
  });

  UserReportSchema.post('save', async function () {
    if (!this.authorUser) return;

    eventEmitter.emit(UserReportEventsEnum.POST_SAVE_UPDATE_REPORT_COUNTS, this);
  });

  UserReportSchema.methods.deleteDoc = async function (this: HydratedDocument<UserReport>) {
    await this.deleteOne();

    eventEmitter.emit(UserReportEventsEnum.DELETE_DOC, this);
  };

  const userReportModel = baseReportModel.discriminator(ModelNames.USER_REPORT, UserReportSchema, ReportTypeEnum.USER);

  return userReportModel;
}
