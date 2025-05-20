import { Controller, Delete, Get, Param, Patch, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { CommentsService } from './comments.service';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentIdParamDto } from '@engagement/admin/shared/dto/comment-id-param.dto';
import { GetCommentsQueryDto } from './dto/get-comments.dto';

@Controller({ path: 'comments', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Patch('suspend/:commentId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.UPDATE })
  async suspendComment(@Persona() adminJWT: AdminJwtPersona, @Param() param: CommentIdParamDto) {
    await this.commentsService.suspendComment(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Patch('unsuspend/:commentId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.UPDATE })
  async unSuspendComment(@Persona() adminJWT: AdminJwtPersona, @Param() param: CommentIdParamDto) {
    await this.commentsService.unSuspendComment(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Delete(':commentId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.DELETE })
  async deleteComment(@Persona() adminJWT: AdminJwtPersona, @Param() param: CommentIdParamDto) {
    await this.commentsService.deleteComment(adminJWT._id, param);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.READ })
  async getComments(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetCommentsQueryDto) {
    const comments = await this.commentsService.getComments(adminJWT._id, query);
    return new CustomResponse().success({
      payload: comments,
    });
  }

  @Get(':commentId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.COMMENTS, operation: AdminResourceOperationsEnum.READ })
  async getCommentById(@Persona() adminJWT: AdminJwtPersona, @Param() param: CommentIdParamDto) {
    const comment = await this.commentsService.getCommentById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: comment,
      },
    });
  }
}
