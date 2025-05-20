import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BasePaginationQuery,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserSegmentIdParamDto } from '@notifications/admin/shared';
import { CalculateUserCountDto } from './dto/calculate-user-count.dto';
import { CreateUserSegmentDto } from './dto/create-user-segment.dto';
import { GetUserSegmentsQueryDto } from './dto/get-user-segments.dto';
import { UpdateUserSegmentDto } from './dto/update-user-segment.dto';
import { UserSegmentsService } from './user-segments.service';
import { CalculateUserCountByUserSegmentsQueryDto } from './dto/calculate-user-count-by-user-segments.dto';

@Controller({ path: 'marketing/user-segments', version: VERSION_NEUTRAL })
@ApiTags('admin/user-segments')
export class UserSegmentsController {
  constructor(private readonly userSegmentsService: UserSegmentsService) {}

  @ApiBearerAuth()
  @Get()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getUserSegments(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetUserSegmentsQueryDto) {
    const userSegments = await this.userSegmentsService.getUserSegments(adminJWT._id, query);

    return new CustomResponse().success({
      payload: userSegments,
    });
  }

  @ApiBearerAuth()
  @Post()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.CREATE })
  async createUserSegment(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateUserSegmentDto) {
    const userSegment = await this.userSegmentsService.createUserSegment(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: userSegment },
    });
  }

  @ApiBearerAuth()
  @Get('calculate-user-count-from-segments')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async calculateUserCountByUserSegments(
    @Persona() adminJWT: AdminJwtPersona,
    @Query() query: CalculateUserCountByUserSegmentsQueryDto,
  ) {
    const totalUsers = await this.userSegmentsService.calculateUserCountByUserSegments(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data: totalUsers },
    });
  }

  @ApiBearerAuth()
  @Post('calculate-user-count-from-filters')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async calculateUserCountByFilters(@Persona() adminJWT: AdminJwtPersona, @Body() body: CalculateUserCountDto) {
    const totalUsers = await this.userSegmentsService.calculateUserCountByFilters(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: totalUsers },
    });
  }

  @ApiBearerAuth()
  @Get(':userSegmentId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getUserSegmentDetails(@Persona() adminJWT: AdminJwtPersona, @Param() params: UserSegmentIdParamDto) {
    const userSegment = await this.userSegmentsService.getUserSegmentDetails(adminJWT._id, params);

    return new CustomResponse().success({
      payload: { data: userSegment },
    });
  }

  @ApiBearerAuth()
  @Patch(':userSegmentId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async updateUserSegment(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: UserSegmentIdParamDto,
    @Body() body: UpdateUserSegmentDto,
  ) {
    const userSegment = await this.userSegmentsService.updateUserSegment(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: userSegment },
    });
  }

  @ApiBearerAuth()
  @Delete(':userSegmentId')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.DELETE })
  async deleteUserSegment(@Persona() adminJWT: AdminJwtPersona, @Param() params: UserSegmentIdParamDto) {
    await this.userSegmentsService.deleteUserSegment(adminJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get(':userSegmentId/sent-push-notifications')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.READ })
  async getNotificationsUsingUserSegment(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: UserSegmentIdParamDto,
    @Query() query: BasePaginationQuery,
  ) {
    const pushNotifications = await this.userSegmentsService.getNotificationsUsingUserSegment(
      adminJWT._id,
      params,
      query,
    );

    return new CustomResponse().success({
      payload: pushNotifications,
    });
  }

  @ApiBearerAuth()
  @Post(':userSegmentId/archive')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async archiveUserSegment(@Persona() adminJWT: AdminJwtPersona, @Param() params: UserSegmentIdParamDto) {
    await this.userSegmentsService.archiveUserSegment(adminJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':userSegmentId/unarchive')
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.UPDATE })
  async unarchiveUserSegment(@Persona() adminJWT: AdminJwtPersona, @Param() params: UserSegmentIdParamDto) {
    await this.userSegmentsService.unarchiveUserSegment(adminJWT._id, params);

    return new CustomResponse().success({});
  }
}
