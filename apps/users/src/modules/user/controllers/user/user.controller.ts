import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BasePaginationQuery,
  BaseSearchPaginationQuery,
  CustomResponse,
  Persona,
  UserJwtPersona,
} from '@instapets-backend/common';
import { UserIdParamDto } from '@users/user/shared/dto/user-id-param.dto';
import { GetUserFollowersQueryDto } from './dto/get-user-followers.dto';
import { GetUserFollowingsQueryDto } from './dto/get-user-followings.dto';
import { UserService } from './user.service';
import { globalControllerVersioning } from '@users/shared/constants';

@Controller({ path: 'user', ...globalControllerVersioning })
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @Get('pending-followers')
  async getPendingFollowers(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const users = await this.userService.getPendingFollowers(userJWT._id, query);

    return new CustomResponse().success({
      payload: users,
    });
  }

  @ApiBearerAuth()
  @Get('followings')
  async getFollowings(@Persona() userJWT: UserJwtPersona, @Query() query: GetUserFollowingsQueryDto) {
    const users = await this.userService.getFollowings(userJWT._id, query);

    return new CustomResponse().success({
      payload: users,
    });
  }

  @ApiBearerAuth()
  @Get('followers')
  async getFollowers(@Persona() userJWT: UserJwtPersona, @Query() query: GetUserFollowersQueryDto) {
    const users = await this.userService.getFollowers(userJWT._id, query);

    return new CustomResponse().success({
      payload: users,
    });
  }

  @ApiBearerAuth()
  @Get('blocked')
  async getBlockedUsers(@Persona() userJWT: UserJwtPersona) {
    const users = await this.userService.getBlockedUsers(userJWT._id);

    return new CustomResponse().success({
      payload: { data: users },
    });
  }

  @ApiBearerAuth()
  @Post('follow/:userId')
  async followUser(@Persona() userJWT: UserJwtPersona, @Param() param: UserIdParamDto) {
    await this.userService.followUser(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Delete('unfollow/:userId')
  async unFollowUser(@Persona() userJWT: UserJwtPersona, @Param() param: UserIdParamDto) {
    await this.userService.unFollowUser(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post('accept-follow/:userId')
  async acceptPendingFollow(@Persona() userJWT: UserJwtPersona, @Param() param: UserIdParamDto) {
    await this.userService.acceptPendingFollow(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Delete('decline-follow/:userId')
  async declinePendingFollow(@Persona() userJWT: UserJwtPersona, @Param() param: UserIdParamDto) {
    await this.userService.declinePendingFollow(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Delete('cancel-follow/:userId')
  async cancelPendingFollow(@Persona() userJWT: UserJwtPersona, @Param() param: UserIdParamDto) {
    await this.userService.cancelPendingFollow(userJWT._id, param);

    return new CustomResponse().success({});
  }

  //TODO: All these url segments should start with :userId
  @Post('block/:userId')
  @ApiBearerAuth()
  async blockUser(@Persona() userJWT: UserJwtPersona, @Param() param: UserIdParamDto) {
    await this.userService.blockUser(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post('unblock/:userId')
  @ApiBearerAuth()
  async unblockUser(@Persona() userJWT: UserJwtPersona, @Param() param: UserIdParamDto) {
    await this.userService.unblockUser(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  async getUsers(@Persona() userJWT: UserJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const users = await this.userService.getUsers(userJWT._id, query);
    return new CustomResponse().success({
      payload: users,
    });
  }
}
