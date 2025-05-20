import { Body, Controller, Get, Param, Post, Query, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import {
  BranchAccessResourceOperationsEnum,
  BranchAccessResourcesEnum,
  BrandOwnerGuard,
  CustomResponse,
  NoApiVersion,
  Persona,
  ServiceProviderJwtPersona,
  ServiceProviderPermission,
} from '@instapets-backend/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { BranchIdParamDto } from '@branches/shared/dto/branch-id-param.dto';
import { GetBranchesQueryDto } from './dto/get-branches.dto';
import { BrandIdQueryDto } from '@branches/serviceprovider/shared/dto/brand-id-query.dto';

@Controller({ path: 'branches', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.BRANCHES,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getAllBranches(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Query() getBranchesQueryDto: GetBranchesQueryDto,
  ) {
    return new CustomResponse().success({
      payload: await this.branchesService.getAllBranches(serviceProviderJwtPersona._id, getBranchesQueryDto),
    });
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Post()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.BRANCHES,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async createBranch(@Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona, @Body() body: CreateBranchDto) {
    await this.branchesService.createBranch(serviceProviderJwtPersona._id, body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Get(':branchId')
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.BRANCHES,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getBranchDetails(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Param() param: BranchIdParamDto,
    @Query() brandIdQueryDto: BrandIdQueryDto,
  ) {
    const branchDetails = await this.branchesService.getBranchDetails(serviceProviderJwtPersona._id, param);
    return new CustomResponse().success({
      payload: {
        data: branchDetails,
      },
    });
  }
}
