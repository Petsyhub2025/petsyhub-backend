import { ReplyIdParamDto } from '@engagement/admin/shared/dto/reply-id-param.dto';
import { Controller, Delete, Get, Param, Patch, Query, VERSION_NEUTRAL } from '@nestjs/common';
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
import { RepliesService } from './replies.service';
import { GetRepliesQueryDto } from './dto/get-replies.dto';

@Controller({ path: 'replies', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class RepliesController {
  constructor(private readonly repliesService: RepliesService) {}

  @Patch('suspend/:replyId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.UPDATE })
  async suspendReply(@Persona() adminJWT: AdminJwtPersona, @Param() param: ReplyIdParamDto) {
    await this.repliesService.suspendReply(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Patch('unsuspend/:replyId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.UPDATE })
  async unSuspendReply(@Persona() adminJWT: AdminJwtPersona, @Param() param: ReplyIdParamDto) {
    await this.repliesService.unSuspendReply(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Delete(':replyId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.DELETE })
  async deleteReply(@Persona() adminJWT: AdminJwtPersona, @Param() param: ReplyIdParamDto) {
    await this.repliesService.deleteReply(adminJWT._id, param);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.READ })
  async getReplies(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetRepliesQueryDto) {
    const replies = await this.repliesService.getReplies(adminJWT._id, query);
    return new CustomResponse().success({
      payload: replies,
    });
  }

  @Get(':replyId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.READ })
  async getReplyById(@Persona() adminJWT: AdminJwtPersona, @Param() param: ReplyIdParamDto) {
    const replies = await this.repliesService.getReplyById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: replies,
      },
    });
  }
}
