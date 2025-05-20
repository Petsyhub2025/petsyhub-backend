import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ICommentModel,
  ICommentReplyModel,
  ICommentReplyReportModel,
  ICommentReportModel,
  IPostModel,
  IPostReportModel,
  IUserModel,
  IUserReportModel,
  ModelNames,
  ReportStatusEnum,
  ReportTypeEnum,
} from '@instapets-backend/common';
import { errorManager } from '@moderation/user/shared/config/errors.config';
import { ObjectIdParamDto } from '@moderation/user/shared/dto/object-id-param.dto';
import { Model, Types } from 'mongoose';
import { ReportObjectDto, ReportObjectQueryDto } from './dto/report-object.dto';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.USER_REPORT) private userReportModel: IUserReportModel,
    @Inject(ModelNames.POST_REPORT) private postReportModel: IPostReportModel,
    @Inject(ModelNames.COMMENT_REPORT) private commentReportModel: ICommentReportModel,
    @Inject(ModelNames.COMMENT_REPLY_REPORT) private commentReplyReportModel: ICommentReplyReportModel,
  ) {}

  async reportObject(
    userId: string,
    { objectId }: ObjectIdParamDto,
    { reportType }: ReportObjectQueryDto,
    { reason }: ReportObjectDto,
  ) {
    await this.checkObjectExists(objectId, reportType);

    //as each type has its own signature, we need to cast it to the base type
    const reportModel = this[`${reportType}ReportModel`] as Model<any>;

    if (await reportModel.exists({ authorUser: userId, [reportType]: objectId, status: ReportStatusEnum.PENDING })) {
      return;
    }

    const payload = {
      authorUser: new Types.ObjectId(userId),
      [reportType]: new Types.ObjectId(objectId),
      reason,
    };
    const report = new reportModel(payload);
    const savedLike = await report.save();
  }

  //TODO: add check as a static for each model
  private async checkObjectExists(objectId: string, reportType: ReportTypeEnum) {
    if (reportType === ReportTypeEnum.COMMENT && !(await this.commentModel.exists({ _id: objectId }))) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }
    if (reportType === ReportTypeEnum.COMMENT_REPLY && !(await this.commentReplyModel.exists({ _id: objectId }))) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }
    if (reportType === ReportTypeEnum.POST && !(await this.postModel.exists({ _id: objectId }))) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }
    if (reportType === ReportTypeEnum.USER && !(await this.userModel.exists({ _id: objectId }))) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }
  }
}
