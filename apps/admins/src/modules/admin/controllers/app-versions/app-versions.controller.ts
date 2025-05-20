import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
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
import { AppVersionsService } from './app-versions.service';
import { CreateVersionDto, CreateVersionQueryDto } from './dto/create-version.dto';
import { VersionIdParamDto } from '../../shared/dto/version-id-param.dto';
import { GetVersionsQueryDto } from './dto/get-versions.dto';

@Controller({ path: 'app-versions', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class AppVersionsController {
  constructor(private readonly appVersionsService: AppVersionsService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.APP_VERSIONS, operation: AdminResourceOperationsEnum.READ })
  async getAppVersions(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetVersionsQueryDto) {
    const versions = await this.appVersionsService.getAppVersions(adminJWT._id, query);
    return new CustomResponse().success({
      payload: versions,
    });
  }

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.APP_VERSIONS, operation: AdminResourceOperationsEnum.CREATE })
  async createVersion(
    @Persona() adminJWT: AdminJwtPersona,
    @Query() query: CreateVersionQueryDto,
    @Body() body: CreateVersionDto,
  ) {
    const version = await this.appVersionsService.createVersion(adminJWT._id, query, body);
    return new CustomResponse().success({
      payload: {
        data: version,
      },
    });
  }

  @Patch(':versionId/deprecate')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.APP_VERSIONS, operation: AdminResourceOperationsEnum.UPDATE })
  async deprecateVersion(@Persona() adminJWT: AdminJwtPersona, @Param() params: VersionIdParamDto) {
    const version = await this.appVersionsService.deprecateVersion(adminJWT._id, params);
    return new CustomResponse().success({
      payload: {
        data: version,
      },
    });
  }

  @Delete(':versionId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.APP_VERSIONS, operation: AdminResourceOperationsEnum.DELETE })
  async deleteVersion(@Persona() adminJWT: AdminJwtPersona, @Param() params: VersionIdParamDto) {
    const version = await this.appVersionsService.deleteVersion(adminJWT._id, params);
    return new CustomResponse().success({});
  }
}
