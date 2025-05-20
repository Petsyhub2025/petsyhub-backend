import { Body, Controller, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { ObjectIdParamDto } from '@moderation/user/shared/dto/object-id-param.dto';
import { ReportObjectDto, ReportObjectQueryDto } from './dto/report-object.dto';
import { globalControllerVersioning } from '@moderation/shared-module/constants';

@Controller({ path: 'reports', ...globalControllerVersioning })
@ApiTags('user')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':objectId')
  @ApiBearerAuth()
  async reportObject(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: ObjectIdParamDto,
    @Query() query: ReportObjectQueryDto,
    @Body() body: ReportObjectDto,
  ) {
    await this.reportsService.reportObject(userJWT._id, params, query, body);
    return new CustomResponse().success({});
  }
}
