import { errorManager } from '@moderation/admin/shared/config/errors.config';
import { ReportIdParamDto } from '@moderation/admin/shared/dto/report-id-param.dto';
import { UserFieldNameEnum, getUserPipeline } from '@moderation/admin/shared/helpers/common-pipeline.helper';
import { getReportPipeLine } from '@moderation/admin/shared/helpers/reports-pipeline.helper';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IBaseReportModel, ModelNames, ReportStatusEnum, addPaginationStages } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { ActionReportsQueryDto } from './dto/action-report.dto';
import { GetReportsQueryDto } from './dto/get-reports.dto';

@Injectable()
export class ReportsService {
  constructor(@Inject(ModelNames.BASE_REPORT) private baseReportModel: IBaseReportModel) {}

  async actionReport(adminJWT: string, { reportId }: ReportIdParamDto, { status }: ActionReportsQueryDto) {
    const report = await this.baseReportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException(errorManager.REPORT_NOT_FOUND);
    }
    if (report.status !== ReportStatusEnum.PENDING) {
      throw new BadRequestException(errorManager.REPORT_CANNOT_BE_ACTIONED);
    }

    report.status = status as unknown as ReportStatusEnum;
    await report.save();
  }

  async rejectReport(adminJWT: string, { reportId }: ReportIdParamDto) {
    const report = await this.baseReportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException(errorManager.REPORT_NOT_FOUND);
    }
    if (report.status !== ReportStatusEnum.PENDING) {
      throw new BadRequestException(errorManager.REPORT_CANNOT_BE_ACTIONED);
    }

    report.status = ReportStatusEnum.ACTIONED;
    await report.save();
  }

  async getReportById(adminJWT: string, { reportId }: ReportIdParamDto) {
    const [report] = await this.baseReportModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(reportId),
        },
      },
      ...getUserPipeline(UserFieldNameEnum.AUTHOR_USER),
      ...getReportPipeLine(),
    ]);
    if (!report) {
      throw new NotFoundException(errorManager.REPORT_NOT_FOUND);
    }

    return report;
  }

  async getReports(adminJWT: string, { page, limit, reportType, status }: GetReportsQueryDto) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(reportType && { reportType }),
          ...(status && { status }),
        },
      },
    ];

    const [[{ count: total } = { count: 0 }], docs] = await Promise.all([
      this.baseReportModel.aggregate(matchStage).count('count'),
      this.baseReportModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getUserPipeline(UserFieldNameEnum.AUTHOR_USER),
        {
          $project: {
            _id: 1,
            authorUser: 1,
            reportType: 1,
            status: 1,
            reason: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }
}
