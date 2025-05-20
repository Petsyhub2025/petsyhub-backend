import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, GetImageVideoPreSignedUrlQueryDto, Persona, UserJwtPersona } from '@instapets-backend/common';
import { PostIdParamDto } from '@posts/shared-module/dto/post-id-param.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsQueryDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';
import { globalControllerVersioning } from '@posts/shared-module/constants';
import { GetAllPostImagesQueryDto } from './dto/get-all-post-images.dto';
import { GetExplorePostsQueryDto } from './dto/get-explore-posts.dto';

@Controller({ path: 'posts', ...globalControllerVersioning })
@ApiTags('user')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @ApiBearerAuth()
  @Get()
  async getPosts(@Persona() userJWT: UserJwtPersona, @Query() query: GetPostsQueryDto) {
    const posts = await this.postsService.getPosts(userJWT._id, query);

    return new CustomResponse().success({
      payload: posts,
    });
  }

  @ApiBearerAuth()
  @Post()
  async createPost(@Persona() userJWT: UserJwtPersona, @Body() body: CreatePostDto) {
    const post = await this.postsService.createPost(userJWT._id, body);

    return new CustomResponse().success({ payload: { data: post } });
  }

  @ApiBearerAuth()
  @Get('explore')
  async getExplorePosts(@Persona() userJWT: UserJwtPersona, @Query() query: GetExplorePostsQueryDto) {
    const posts = await this.postsService.getExplorePosts(userJWT._id, query);

    return new CustomResponse().success({
      payload: posts,
    });
  }

  @ApiBearerAuth()
  @Get('all-post-images')
  async getAllPostImages(@Persona() userJWT: UserJwtPersona, @Query() query: GetAllPostImagesQueryDto) {
    const images = await this.postsService.getAllPostImages(userJWT._id, query);

    return new CustomResponse().success({
      payload: images,
    });
  }

  @ApiBearerAuth()
  @Get(':postId')
  async getPostById(@Persona() userJWT: UserJwtPersona, @Param() params: PostIdParamDto) {
    const post = await this.postsService.getPostById(userJWT._id, params);

    return new CustomResponse().success({
      payload: { data: post },
    });
  }

  @ApiBearerAuth()
  @Patch(':postId')
  async updatePost(@Persona() userJWT: UserJwtPersona, @Param() params: PostIdParamDto, @Body() body: UpdatePostDto) {
    const post = await this.postsService.updatePost(userJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: post },
    });
  }

  @ApiBearerAuth()
  @Delete(':postId')
  async deletePost(@Persona() userJWT: UserJwtPersona, @Param() params: PostIdParamDto) {
    await this.postsService.deletePost(userJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get(':postId/tagged')
  async getTaggedUsersAndPets(@Persona() userJWT: UserJwtPersona, @Param() params: PostIdParamDto) {
    const taggedUsersAndPets = await this.postsService.getTaggedUsersAndPets(userJWT._id, params);

    return new CustomResponse().success({
      payload: { data: taggedUsersAndPets },
    });
  }
}
