import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { globalControllerVersioning } from '@pets/shared/constants';
import { FoundPostsService } from './found-posts.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Persona,
  UserJwtPersona,
  BasePaginationQuery,
  CustomResponse,
  GetImagePreSignedUrlQueryDto,
} from '@instapets-backend/common';
import { CreateFoundPostDto } from './dto/create-found-post.dto';
import { FoundPostIdParamDto } from './dto/found-post-id-param.dto';
import { UpdateFoundPostDto } from './dto/update-found-post.dto';

@Controller({ path: 'found-posts', ...globalControllerVersioning })
@ApiTags('user/lost-found')
export class FoundPostsController {
  constructor(private readonly foundPostsService: FoundPostsService) {}

  @Get()
  @ApiBearerAuth()
  async getFoundPosts(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const foundPosts = await this.foundPostsService.getFoundPosts(userJWT._id, query);

    return new CustomResponse().success({
      payload: foundPosts,
    });
  }

  @Post()
  @ApiBearerAuth()
  async createFoundPost(@Persona() userJWT: UserJwtPersona, @Body() body: CreateFoundPostDto) {
    const foundPost = await this.foundPostsService.createFoundPost(userJWT._id, body);

    return new CustomResponse().success({
      payload: { data: foundPost },
    });
  }

  @Get(':foundPostId')
  @ApiBearerAuth()
  async getFoundPostDetails(@Persona() userJWT: UserJwtPersona, @Param() param: FoundPostIdParamDto) {
    const foundPost = await this.foundPostsService.getFoundPostDetails(userJWT._id, param);

    return new CustomResponse().success({
      payload: { data: foundPost },
    });
  }

  @Patch(':foundPostId')
  @ApiBearerAuth()
  async updateFoundPost(
    @Persona() userJWT: UserJwtPersona,
    @Param() param: FoundPostIdParamDto,
    @Body() body: UpdateFoundPostDto,
  ) {
    const foundPost = await this.foundPostsService.updateFoundPost(userJWT._id, param, body);

    return new CustomResponse().success({
      payload: { data: foundPost },
    });
  }

  @Delete(':foundPostId')
  @ApiBearerAuth()
  async deleteFoundPost(@Persona() userJWT: UserJwtPersona, @Param() param: FoundPostIdParamDto) {
    await this.foundPostsService.deleteFoundPost(userJWT._id, param);

    return new CustomResponse().success({});
  }
}
