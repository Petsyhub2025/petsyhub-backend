import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DynamicLinkIdParamDto } from '@notifications/admin/shared';
import { CreateDynamicLinkDto } from './dto/create-dynamic-link.dto';
import { GetDynamicLinksQueryDto } from './dto/get-dynamic-links.dto';
import { UpdateDynamicLinkDto } from './dto/update-dynamic-link.dto';
import { DynamicLinksService } from './dynamic-links.service';
import { GetDynamicLinkAnalyticsQueryDto } from './dto/get-dynamic-link-analytics.dto';

@Controller({ path: 'marketing/dynamic-links', version: VERSION_NEUTRAL })
@ApiTags('admin/dynamic-links')
export class DynamicLinksController {
  constructor(private readonly dynamicLinksService: DynamicLinksService) {}

  @ApiBearerAuth()
  @Get()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getDynamicLinks(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetDynamicLinksQueryDto) {
    const dynamicLinks = await this.dynamicLinksService.getDynamicLinks(adminJWT._id, query);

    return new CustomResponse().success({
      payload: dynamicLinks,
    });
  }

  @ApiBearerAuth()
  @Post()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.CREATE })
  async createDynamicLink(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateDynamicLinkDto) {
    const dynamicLink = await this.dynamicLinksService.createDynamicLink(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: dynamicLink },
    });
  }

  @ApiBearerAuth()
  @Get(':dynamicLinkId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getDynamicLinkById(@Persona() adminJWT: AdminJwtPersona, @Param() params: DynamicLinkIdParamDto) {
    const dynamicLink = await this.dynamicLinksService.getDynamicLinkById(adminJWT._id, params);

    return new CustomResponse().success({
      payload: { data: dynamicLink },
    });
  }

  @ApiBearerAuth()
  @Patch(':dynamicLinkId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async updateDynamicLink(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: DynamicLinkIdParamDto,
    @Body() body: UpdateDynamicLinkDto,
  ) {
    const dynamicLink = await this.dynamicLinksService.updateDynamicLink(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: dynamicLink },
    });
  }

  @ApiBearerAuth()
  @Delete(':dynamicLinkId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.DELETE })
  async deleteDynamicLink(@Persona() adminJWT: AdminJwtPersona, @Param() params: DynamicLinkIdParamDto) {
    await this.dynamicLinksService.deleteDynamicLink(adminJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':dynamicLinkId/archive')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async archiveDynamicLink(@Persona() adminJWT: AdminJwtPersona, @Param() params: DynamicLinkIdParamDto) {
    await this.dynamicLinksService.archiveDynamicLink(adminJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':dynamicLinkId/unarchive')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async unarchiveDynamicLink(@Persona() adminJWT: AdminJwtPersona, @Param() params: DynamicLinkIdParamDto) {
    await this.dynamicLinksService.unarchiveDynamicLink(adminJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get(':dynamicLinkId/analytics')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getDynamicLinkAnalytics(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: DynamicLinkIdParamDto,
    @Query() query: GetDynamicLinkAnalyticsQueryDto,
  ) {
    const analytics = await this.dynamicLinksService.getDynamicLinkAnalytics(adminJWT._id, params, query);

    return new CustomResponse().success({
      payload: { data: analytics },
    });
  }
}
