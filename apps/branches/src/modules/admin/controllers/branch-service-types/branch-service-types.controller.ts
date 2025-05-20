import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BaseSearchPaginationQuery,
  CustomResponse,
  GetImagePreSignedUrlQueryDto,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { BranchServiceTypesService } from './branch-service-types.service';
import { TypeIdParamDto } from '@serviceproviders/admin/shared/dto/type-id-param.dto';
import { UpdateBranchServiceTypeDto } from './dto/update-branch-service-type.dto';
import { CreateBranchServiceTypeDto } from './dto/create-branch-service-type.dto';

@Controller({ path: 'service-types', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class BranchServiceTypesController {
  constructor(private readonly branchServiceTypesService: BranchServiceTypesService) {}

  @ApiBearerAuth()
  @Get('pre-signed-url')
  @AdminPermission({ resource: AdminResourcesEnum.BRANCH_SERVICE_TYPE, operation: AdminResourceOperationsEnum.UPDATE })
  async getUploadPreSignedUrl(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetImagePreSignedUrlQueryDto) {
    const data = await this.branchServiceTypesService.generatePresignedUrl(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data },
    });
  }

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.BRANCH_SERVICE_TYPE, operation: AdminResourceOperationsEnum.CREATE })
  async createClinicServiceType(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateBranchServiceTypeDto) {
    const clinicServiceType = await this.branchServiceTypesService.createBranchServiceType(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: clinicServiceType },
    });
  }

  @Patch(':typeId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.BRANCH_SERVICE_TYPE, operation: AdminResourceOperationsEnum.UPDATE })
  async updateClinicServiceType(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: TypeIdParamDto,
    @Body() body: UpdateBranchServiceTypeDto,
  ) {
    const clinicServiceType = await this.branchServiceTypesService.updateBranchServiceType(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: clinicServiceType },
    });
  }

  @Delete(':typeId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.BRANCH_SERVICE_TYPE, operation: AdminResourceOperationsEnum.DELETE })
  async deleteClinicServiceType(@Persona() adminJWT: AdminJwtPersona, @Param() params: TypeIdParamDto) {
    await this.branchServiceTypesService.deleteBranchServiceType(adminJWT._id, params);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.BRANCH_SERVICE_TYPE, operation: AdminResourceOperationsEnum.READ })
  async getClinicServiceTypes(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const clinicServiceTypes = await this.branchServiceTypesService.getBranchServiceTypes(adminJWT._id, query);
    return new CustomResponse().success({
      payload: clinicServiceTypes,
    });
  }

  @Get(':typeId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.BRANCH_SERVICE_TYPE, operation: AdminResourceOperationsEnum.READ })
  async getClinicServiceTypeById(@Persona() adminJWT: AdminJwtPersona, @Param() param: TypeIdParamDto) {
    const clinicServiceType = await this.branchServiceTypesService.getBranchServiceTypeById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: clinicServiceType,
      },
    });
  }
}
