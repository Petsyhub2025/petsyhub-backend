import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { Controller, Delete, Get, Param, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LostPostIdParamDto } from '@pets/admin/shared/dto/lost-post-id-param.dto';
import { GetLostPostsQueryDto } from './dto/get-lost-posts.dto';
import { LostPostsService } from './lost-posts.service';

@Controller({ path: 'lost-posts', version: VERSION_NEUTRAL })
@ApiTags('admin/lost-found')
export class LostPostsController {
  constructor(private readonly lostPostsService: LostPostsService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.READ })
  async getLostPosts(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetLostPostsQueryDto) {
    const lostPosts = await this.lostPostsService.getLostPosts(adminJWT._id, query);

    return new CustomResponse().success({
      payload: lostPosts,
    });
  }

  @Get(':lostPostId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.READ })
  async getLostPostDetails(@Persona() adminJWT: AdminJwtPersona, @Param() param: LostPostIdParamDto) {
    const lostPost = await this.lostPostsService.getLostPostDetails(adminJWT._id, param);

    return new CustomResponse().success({
      payload: { data: lostPost },
    });
  }

  @Delete(':lostPostId')
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.DELETE })
  async deleteLostPost(@Persona() adminJWT: AdminJwtPersona, @Param() param: LostPostIdParamDto) {
    await this.lostPostsService.deleteLostPost(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post(':lostPostId/suspend')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.UPDATE })
  async suspendLostPost(@Persona() adminJWT: AdminJwtPersona, @Param() param: LostPostIdParamDto) {
    await this.lostPostsService.suspendLostPost(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Post(':lostPostId/unsuspend')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.UPDATE })
  async unSuspendLostPost(@Persona() adminJWT: AdminJwtPersona, @Param() param: LostPostIdParamDto) {
    await this.lostPostsService.unSuspendLostPost(adminJWT._id, param);

    return new CustomResponse().success({});
  }
}
