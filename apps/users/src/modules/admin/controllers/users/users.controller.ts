import { Body, Controller, Get, Param, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
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
import { UserIdParamDto } from '../../shared/dto/user-id-param.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { UsersService } from './users.service';

@Controller({ path: 'users', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.USERS, operation: AdminResourceOperationsEnum.READ })
  async getUsers(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetUsersQueryDto) {
    const users = await this.usersService.getUsers(adminJWT._id, query);
    return new CustomResponse().success({
      payload: users,
    });
  }

  @Get(':userId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.USERS, operation: AdminResourceOperationsEnum.READ })
  async getUserById(@Persona() adminJWT: AdminJwtPersona, @Param() param: UserIdParamDto) {
    const user = await this.usersService.getUserById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: user,
      },
    });
  }

  @Post(':userId/suspend')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.USERS, operation: AdminResourceOperationsEnum.UPDATE })
  async suspendUser(@Persona() adminJWT: AdminJwtPersona, @Param() param: UserIdParamDto) {
    await this.usersService.suspendUser(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post(':userId/unsuspend')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.USERS, operation: AdminResourceOperationsEnum.UPDATE })
  async unSuspendUser(@Persona() adminJWT: AdminJwtPersona, @Param() param: UserIdParamDto) {
    await this.usersService.unSuspendUser(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post(':userId/block')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.USERS, operation: AdminResourceOperationsEnum.UPDATE })
  async blockUser(@Persona() adminJWT: AdminJwtPersona, @Param() param: UserIdParamDto, @Body() body: BlockUserDto) {
    await this.usersService.blockUser(adminJWT._id, param, body);

    return new CustomResponse().success({});
  }
}
