import { Controller, Delete, Get, Param, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PostIdParamDto } from '@posts/shared-module/dto/post-id-param.dto';
import {
  Persona,
  AdminJwtPersona,
  CustomResponse,
  AdminPermission,
  AdminResourcesEnum,
  AdminResourceOperationsEnum,
} from '@instapets-backend/common';
import { GetPostsQueryDto } from './dto/get-posts.dto';
import { PostsService } from './posts.service';

@Controller({ path: 'posts', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @ApiBearerAuth()
  @Get()
  @AdminPermission({ resource: AdminResourcesEnum.POSTS, operation: AdminResourceOperationsEnum.READ })
  async getPosts(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetPostsQueryDto) {
    const posts = await this.postsService.getPosts(query);

    return new CustomResponse().success({
      payload: posts,
    });
  }

  @ApiBearerAuth()
  @Get(':postId')
  @AdminPermission({ resource: AdminResourcesEnum.POSTS, operation: AdminResourceOperationsEnum.READ })
  async getPostById(@Persona() adminJWT: AdminJwtPersona, @Param() params: PostIdParamDto) {
    const post = await this.postsService.getPostById(params);

    return new CustomResponse().success({
      payload: { data: post },
    });
  }

  @ApiBearerAuth()
  @Delete(':postId')
  @AdminPermission({ resource: AdminResourcesEnum.POSTS, operation: AdminResourceOperationsEnum.DELETE })
  async deletePost(@Persona() adminJWT: AdminJwtPersona, @Param() params: PostIdParamDto) {
    await this.postsService.deletePost(params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':postId/suspend')
  @AdminPermission({ resource: AdminResourcesEnum.POSTS, operation: AdminResourceOperationsEnum.UPDATE })
  async suspendPost(@Persona() adminJWT: AdminJwtPersona, @Param() params: PostIdParamDto) {
    await this.postsService.suspendPost(params);

    return new CustomResponse().success({});
  }
}
