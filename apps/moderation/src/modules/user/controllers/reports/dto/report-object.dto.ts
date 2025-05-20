import { ReportReasonEnum, ReportTypeEnum } from '@instapets-backend/common';
import { IsEnum, IsString } from 'class-validator';

export class ReportObjectQueryDto {
  @IsEnum(ReportTypeEnum)
  reportType: ReportTypeEnum;
}

export class ReportObjectDto {
  @IsString()
  @IsEnum(ReportReasonEnum)
  reason: ReportReasonEnum;
}
