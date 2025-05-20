import { AreaIdParamDto } from '@areas/admin/shared/dto/area-id-param.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { GetAreasQueryDto } from './dto/get-areas.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Controller({ path: 'areas', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.AREAS, operation: AdminResourceOperationsEnum.READ })
  async getAreas(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetAreasQueryDto) {
    const areas = await this.areasService.getAreas(adminJWT._id, query);
    return new CustomResponse().success({
      payload: areas,
    });
  }

  @Post()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.AREAS, operation: AdminResourceOperationsEnum.CREATE })
  async createArea(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateAreaDto) {
    const area = await this.areasService.createArea(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: area },
    });
  }

  @Get(':areaId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.AREAS, operation: AdminResourceOperationsEnum.READ })
  async getAreaById(@Persona() adminJWT: AdminJwtPersona, @Param() param: AreaIdParamDto) {
    const area = await this.areasService.getAreaById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: area,
      },
    });
  }

  @Patch(':areaId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.AREAS, operation: AdminResourceOperationsEnum.UPDATE })
  async updateArea(@Persona() adminJWT: AdminJwtPersona, @Param() param: AreaIdParamDto, @Body() body: UpdateAreaDto) {
    const area = await this.areasService.updateArea(adminJWT._id, param, body);

    return new CustomResponse().success({
      payload: { data: area },
    });
  }

  @Delete(':areaId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.AREAS, operation: AdminResourceOperationsEnum.DELETE })
  async deleteArea(@Persona() adminJWT: AdminJwtPersona, @Param() param: AreaIdParamDto) {
    await this.areasService.deleteArea(adminJWT._id, param);

    return new CustomResponse().success({});
  }
}
