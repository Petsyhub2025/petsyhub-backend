import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { ObjectIdParamDto } from '@engagement/user/shared/dto/object-id-param.dto';
import { GetLikersQueryDto } from './dto/get-likers.dto';
import { LikeObjectQueryDto } from './dto/like-object.dto';
import { UnLikeObjectQueryDto } from './dto/unlike-object.dto';
import { LikesService } from './likes.service';
import { globalControllerVersioning } from '@engagement/shared-module/constants';

@Controller({ path: 'likes', ...globalControllerVersioning })
@ApiTags('user')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('/like/:objectId')
  @ApiBearerAuth()
  async likeObject(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: ObjectIdParamDto,
    @Query() query: LikeObjectQueryDto,
  ) {
    await this.likesService.likeObject(userJWT._id, params, query);
    return new CustomResponse().success({});
  }

  @Delete('/unlike/:objectId')
  @ApiBearerAuth()
  async unLikeObject(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: ObjectIdParamDto,
    @Query() query: UnLikeObjectQueryDto,
  ) {
    await this.likesService.unLikeObject(userJWT._id, params, query);
    return new CustomResponse().success({});
  }

  @Get('/likers/:objectId')
  @ApiBearerAuth()
  async getLikers(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: ObjectIdParamDto,
    @Query() query: GetLikersQueryDto,
  ) {
    const likers = await this.likesService.getLikers(userJWT._id, params, query);
    return new CustomResponse().success({ payload: likers });
  }
}
