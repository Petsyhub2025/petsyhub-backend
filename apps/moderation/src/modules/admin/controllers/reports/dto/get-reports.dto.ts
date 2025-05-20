import { BasePaginationQuery, ReportStatusEnum, ReportTypeEnum } from '@instapets-backend/common';
import { IsEnum, IsOptional } from 'class-validator';

export class GetReportsQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsEnum(ReportTypeEnum)
  reportType?: ReportTypeEnum;

  @IsOptional()
  @IsEnum(ReportStatusEnum)
  status?: ReportStatusEnum;
}
