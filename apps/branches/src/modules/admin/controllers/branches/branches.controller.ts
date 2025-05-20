import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { AdminJwtPersona, CustomResponse, Persona } from '@instapets-backend/common';
import { GetBranchesDto } from './dto/get-branches.dto';
import { BranchIdParamDto } from '@branches/shared/dto/branch-id-param.dto';
import { RejectBranchDto } from './dto/reject-branch.dto';

@Controller('branches')
@ApiTags('admin')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  @ApiBearerAuth()
  async getBranches(@Persona() adminJwtPersona: AdminJwtPersona, @Query() getBranchesDto: GetBranchesDto) {
    return new CustomResponse().success({
      payload: await this.branchesService.getBranches(adminJwtPersona._id, getBranchesDto),
    });
  }

  @Get(':branchId')
  @ApiBearerAuth()
  async getBranchById(@Persona() adminJwtPersona: AdminJwtPersona, @Param() branchIdParamDto: BranchIdParamDto) {
    return new CustomResponse().success({
      payload: await this.branchesService.getBranchById(adminJwtPersona._id, branchIdParamDto),
    });
  }

  @Patch(':branchId/accept')
  @ApiBearerAuth()
  async acceptBranch(@Persona() adminJwtPersona: AdminJwtPersona, @Param() branchIdParamDto: BranchIdParamDto) {
    await this.branchesService.acceptBranch(adminJwtPersona._id, branchIdParamDto);
    return new CustomResponse().success({});
  }

  @Patch(':branchId/reject')
  @ApiBearerAuth()
  async rejectBranch(
    @Persona() adminJwtPersona: AdminJwtPersona,
    @Param() branchIdParamDto: BranchIdParamDto,
    @Body() rejectBranchDto: RejectBranchDto,
  ) {
    await this.branchesService.rejectBranch(adminJwtPersona._id, branchIdParamDto, rejectBranchDto);
    return new CustomResponse().success({});
  }

  @Patch(':branchId/suspend')
  @ApiBearerAuth()
  async suspendBranch(@Persona() adminJwtPersona: AdminJwtPersona, @Param() branchIdParamDto: BranchIdParamDto) {
    await this.branchesService.suspendBranch(adminJwtPersona._id, branchIdParamDto);
    return new CustomResponse().success({});
  }

  @Patch(':branchId/unsuspend')
  @ApiBearerAuth()
  async unSuspendBranch(@Persona() adminJwtPersona: AdminJwtPersona, @Param() branchIdParamDto: BranchIdParamDto) {
    await this.branchesService.unSuspendBranch(adminJwtPersona._id, branchIdParamDto);
    return new CustomResponse().success({});
  }
}
