import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, NoApiVersion, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { BranchAccessRoleService } from './branch-access-role.service';
import { GetBranchAccessRolesQueryDto } from './dto/get-branch-access-role.dto';

@Controller({ path: 'branch-access-roles', version: VERSION_NEUTRAL })
@ApiTags('serviceProviders')
export class BranchAccessRoleController {
  constructor(private readonly branchAccessRoleService: BranchAccessRoleService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  async getBranchAccessRoles(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Query() qetBranchAccessRolesQueryDto: GetBranchAccessRolesQueryDto,
  ) {
    const branchAccessRoles = await this.branchAccessRoleService.getBranchAccessRoles(
      serviceProviderJwtPersona._id,
      qetBranchAccessRolesQueryDto,
    );

    return new CustomResponse().success({
      payload: {
        data: branchAccessRoles,
      },
    });
  }
}
