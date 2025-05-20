import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsEnum, IsInstance, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { ReportReasonEnum, ReportStatusEnum, ReportTypeEnum } from './base-report.enum';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class BaseReport extends BaseModel<BaseReport> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  authorUser: Types.ObjectId;

  @IsString()
  @IsEnum(ReportReasonEnum)
  reason: ReportReasonEnum;

  @IsString()
  @IsEnum(ReportStatusEnum)
  status: ReportStatusEnum;

  @IsString()
  @IsEnum(ReportTypeEnum)
  reportType: ReportTypeEnum;
}

export interface IBaseReportInstanceMethods extends IBaseInstanceMethods {}
export interface IBaseReportModel extends Model<BaseReport, Record<string, unknown>, IBaseReportInstanceMethods> {}
