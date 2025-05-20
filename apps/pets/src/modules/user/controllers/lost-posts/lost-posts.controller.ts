import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { globalControllerVersioning } from '@pets/shared/constants';
import { LostPostsService } from './lost-posts.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BasePaginationQuery,
  CustomResponse,
  GetImagePreSignedUrlQueryDto,
  Persona,
  UserJwtPersona,
} from '@instapets-backend/common';
import { CreateLostPostDto } from './dto/create-lost-post.dto';
import { LostPostIdParamDto } from './dto/lost-post-id-param.dto';
import { UpdateLostPostDto } from './dto/update-lost-post.dto';

@Controller({ path: 'lost-posts', ...globalControllerVersioning })
@ApiTags('user/lost-found')
export class LostPostsController {
  constructor(private readonly lostPostsService: LostPostsService) {}

  @Get()
  @ApiBearerAuth()
  async getLostPosts(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const lostPosts = await this.lostPostsService.getLostPosts(userJWT._id, query);

    return new CustomResponse().success({
      payload: lostPosts,
    });
  }

  @Post()
  @ApiBearerAuth()
  async createLostPost(@Persona() userJWT: UserJwtPersona, @Body() body: CreateLostPostDto) {
    const lostPost = await this.lostPostsService.createLostPost(userJWT._id, body);

    return new CustomResponse().success({
      payload: { data: lostPost },
    });
  }

  @Get(':lostPostId')
  @ApiBearerAuth()
  async getLostPostDetails(@Persona() userJWT: UserJwtPersona, @Param() param: LostPostIdParamDto) {
    const lostPost = await this.lostPostsService.getLostPostDetails(userJWT._id, param);

    return new CustomResponse().success({
      payload: { data: lostPost },
    });
  }

  @Patch(':lostPostId')
  @ApiBearerAuth()
  async updateLostPost(
    @Persona() userJWT: UserJwtPersona,
    @Param() param: LostPostIdParamDto,
    @Body() body: UpdateLostPostDto,
  ) {
    const lostPost = await this.lostPostsService.updateLostPost(userJWT._id, param, body);

    return new CustomResponse().success({
      payload: { data: lostPost },
    });
  }

  @Delete(':lostPostId')
  @ApiBearerAuth()
  async deleteLostPost(@Persona() userJWT: UserJwtPersona, @Param() param: LostPostIdParamDto) {
    await this.lostPostsService.deleteLostPost(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post(':lostPostId/mark-as-found')
  @ApiBearerAuth()
  async markLostPostAsFound(@Persona() userJWT: UserJwtPersona, @Param() param: LostPostIdParamDto) {
    await this.lostPostsService.markLostPostAsFound(userJWT._id, param);

    return new CustomResponse().success({});
  }
}
