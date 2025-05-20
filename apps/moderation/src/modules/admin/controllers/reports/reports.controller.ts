import { Controller, Get, Param, Patch, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { ReportsService } from './reports.service';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { ReportIdParamDto } from '../../shared/dto/report-id-param.dto';
import { ActionReportsQueryDto } from './dto/action-report.dto';

@Controller({ path: 'reports', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':reportId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MODERATION_REPORTS, operation: AdminResourceOperationsEnum.READ })
  async getReportById(@Persona() adminJWT: AdminJwtPersona, @Param() param: ReportIdParamDto) {
    const report = await this.reportsService.getReportById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: report,
      },
    });
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MODERATION_REPORTS, operation: AdminResourceOperationsEnum.READ })
  async getReports(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetReportsQueryDto) {
    const reports = await this.reportsService.getReports(adminJWT._id, query);
    return new CustomResponse().success({
      payload: reports,
    });
  }

  @Patch('action/:reportId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MODERATION_REPORTS, operation: AdminResourceOperationsEnum.UPDATE })
  async actionReport(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() param: ReportIdParamDto,
    @Query() query: ActionReportsQueryDto,
  ) {
    await this.reportsService.actionReport(adminJWT._id, param, query);
    return new CustomResponse().success({});
  }
}
