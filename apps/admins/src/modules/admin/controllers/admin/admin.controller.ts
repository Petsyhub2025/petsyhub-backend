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
import { AdminIdParamDto } from '../../shared/dto/admin-id-param.dto';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { GetAdminsQueryDto } from './dto/get-admins.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateSelfProfileDto } from './dto/update-self-profile.dto';

@Controller({ path: 'admin', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMINS, operation: AdminResourceOperationsEnum.READ })
  async getAdmins(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetAdminsQueryDto) {
    const admins = await this.adminService.getAdmins(adminJWT._id, query);
    return new CustomResponse().success({
      payload: admins,
    });
  }

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMINS, operation: AdminResourceOperationsEnum.CREATE })
  async createAdmin(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateAdminDto) {
    const newAdmin = await this.adminService.createAdmin(body);

    return new CustomResponse().success({
      payload: { data: newAdmin },
    });
  }

  @Patch()
  @ApiBearerAuth()
  @NoApiVersion()
  async updateSelfProfile(@Persona() adminJWT: AdminJwtPersona, @Body() body: UpdateSelfProfileDto) {
    const admin = await this.adminService.updateSelfProfile(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: admin },
    });
  }

  @Get(':adminId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMINS, operation: AdminResourceOperationsEnum.READ })
  async getAdminById(@Persona() adminJWT: AdminJwtPersona, @Param() param: AdminIdParamDto) {
    const admin = await this.adminService.getAdminById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: admin,
      },
    });
  }

  @Patch(':adminId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMINS, operation: AdminResourceOperationsEnum.UPDATE })
  async updateAdmin(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() param: AdminIdParamDto,
    @Body() body: UpdateAdminDto,
  ) {
    const newAdmin = await this.adminService.updateAdmin(param, body);

    return new CustomResponse().success({
      payload: { data: newAdmin },
    });
  }

  @Delete(':adminId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.ADMINS, operation: AdminResourceOperationsEnum.DELETE })
  async deleteAdmin(@Persona() adminJWT: AdminJwtPersona, @Param() param: AdminIdParamDto) {
    await this.adminService.deleteAdmin(adminJWT._id, param);
    return new CustomResponse().success({});
  }
}
