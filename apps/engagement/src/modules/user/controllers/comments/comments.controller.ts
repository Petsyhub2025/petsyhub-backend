import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments.dto';
import { PostIdParamDto } from '@engagement/user/shared/dto/post-id-param.dto';
import { CommentIdParamDto } from '@engagement/user/shared/dto/comment-id-param.dto';
import { globalControllerVersioning } from '@engagement/shared-module/constants';

@Controller({ path: 'comments', ...globalControllerVersioning })
@ApiTags('user')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':postId')
  @ApiBearerAuth()
  async getComments(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: PostIdParamDto,
    @Query() query: GetCommentsQueryDto,
  ) {
    const comments = await this.commentsService.getComments(userJWT._id, params, query);
    return new CustomResponse().success({
      payload: {
        data: comments,
      },
    });
  }

  @Post(':postId')
  @ApiBearerAuth()
  async createComment(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: PostIdParamDto,
    @Body() body: CreateCommentDto,
  ) {
    const comment = await this.commentsService.createComment(userJWT._id, params, body);
    return new CustomResponse().success({
      payload: {
        data: comment,
      },
    });
  }

  @Patch(':commentId')
  @ApiBearerAuth()
  async updateComment(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: CommentIdParamDto,
    @Body() body: UpdateCommentDto,
  ) {
    const comment = await this.commentsService.updateComment(userJWT._id, params, body);
    return new CustomResponse().success({
      payload: {
        data: comment,
      },
    });
  }

  @Delete(':commentId')
  @ApiBearerAuth()
  async deleteComment(@Persona() userJWT: UserJwtPersona, @Param() params: CommentIdParamDto) {
    await this.commentsService.deleteComment(userJWT._id, params);
    return new CustomResponse().success({});
  }
}
