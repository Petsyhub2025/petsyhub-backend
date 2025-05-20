import { ReportStatusEnum } from '@instapets-backend/common';
import { IsEnum, IsString } from 'class-validator';

export enum AllowedStatusEnum {
  REJECTED = ReportStatusEnum.REJECTED,
  ACTIONED = ReportStatusEnum.ACTIONED,
}

export class ActionReportsQueryDto {
  @IsString()
  @IsEnum(AllowedStatusEnum)
  status: AllowedStatusEnum;
}
