import { IsMongoId } from 'class-validator';

export class ReportIdParamDto {
  @IsMongoId()
  reportId: string;
}
