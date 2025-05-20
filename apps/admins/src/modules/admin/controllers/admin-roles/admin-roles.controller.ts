import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BasePaginationQuery,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { RoleIdParamDto } from '../../shared/dto/role-id-param.dto';
import { AdminRolesService } from './admin-roles-roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleBodyDto } from './dto/update-role.dto';

@Controller({ path: 'roles', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMIN_ROLES, operation: AdminResourceOperationsEnum.CREATE })
  async createRole(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateRoleDto) {
    const role = await this.adminRolesService.createRole(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: role },
    });
  }

  @Patch(':roleId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMIN_ROLES, operation: AdminResourceOperationsEnum.UPDATE })
  async updateRole(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() param: RoleIdParamDto,
    @Body() body: UpdateRoleBodyDto,
  ) {
    const role = await this.adminRolesService.updateRole(adminJWT._id, param, body);

    return new CustomResponse().success({
      payload: { data: role },
    });
  }

  @Delete(':roleId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMIN_ROLES, operation: AdminResourceOperationsEnum.DELETE })
  async deleteRole(@Persona() adminJWT: AdminJwtPersona, @Param() param: RoleIdParamDto) {
    await this.adminRolesService.deleteRole(adminJWT._id, param);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMIN_ROLES, operation: AdminResourceOperationsEnum.READ })
  async getRoles(@Persona() adminJWT: AdminJwtPersona, @Query() query: BasePaginationQuery) {
    const roles = await this.adminRolesService.getRoles(adminJWT._id, query);
    return new CustomResponse().success({
      payload: roles,
    });
  }

  @Get(':roleId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMIN_ROLES, operation: AdminResourceOperationsEnum.READ })
  async getRoleById(@Persona() adminJWT: AdminJwtPersona, @Param() param: RoleIdParamDto) {
    const role = await this.adminRolesService.getRoleById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: role,
      },
    });
  }
}
