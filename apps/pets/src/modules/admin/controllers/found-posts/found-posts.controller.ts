import { Controller, Delete, Get, Param, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FoundPostsService } from './found-posts.service';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { FoundPostIdParamDto } from '@pets/admin/shared/dto/found-post-id-param.dto';
import { GetFoundPostsQueryDto } from './dto/get-found-posts.dto';

@Controller({ path: 'found-posts', version: VERSION_NEUTRAL })
@ApiTags('admin/found-found')
export class FoundPostsController {
  constructor(private readonly foundPostsService: FoundPostsService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.READ })
  async getFoundPosts(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetFoundPostsQueryDto) {
    const foundPosts = await this.foundPostsService.getFoundPosts(adminJWT._id, query);

    return new CustomResponse().success({
      payload: foundPosts,
    });
  }

  @Get(':foundPostId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.READ })
  async getFoundPostDetails(@Persona() adminJWT: AdminJwtPersona, @Param() param: FoundPostIdParamDto) {
    const foundPost = await this.foundPostsService.getFoundPostDetails(adminJWT._id, param);

    return new CustomResponse().success({
      payload: { data: foundPost },
    });
  }

  @Delete(':foundPostId')
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.DELETE })
  async deleteFoundPost(@Persona() adminJWT: AdminJwtPersona, @Param() param: FoundPostIdParamDto) {
    await this.foundPostsService.deleteFoundPost(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post(':foundPostId/suspend')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.UPDATE })
  async suspendFoundPost(@Persona() adminJWT: AdminJwtPersona, @Param() param: FoundPostIdParamDto) {
    await this.foundPostsService.suspendFoundPost(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post(':foundPostId/unsuspend')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.UPDATE })
  async unSuspendFoundPost(@Persona() adminJWT: AdminJwtPersona, @Param() param: FoundPostIdParamDto) {
    await this.foundPostsService.unSuspendFoundPost(adminJWT._id, param);

    return new CustomResponse().success({});
  }
}
