import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
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
import { BranchAccessRoleService } from './branch-access-role.service';
import { CreateBranchAccessRoleDto } from './dto/create-branch-access-role.dto';

@Controller({ path: 'branch-access-roles', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class BranchAccessRoleController {
  constructor(private readonly branchAccessRoleService: BranchAccessRoleService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.BRANCH_SERVICE_TYPE, operation: AdminResourceOperationsEnum.CREATE })
  async createBranchAccessRole(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateBranchAccessRoleDto) {
    await this.branchAccessRoleService.createBranchAccessRole(adminJWT._id, body);

    return new CustomResponse().success({});
  }
}
