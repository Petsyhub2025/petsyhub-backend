import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RepliesService } from './replies.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { GetRepliesQueryDto } from './dto/get-replies.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { CommentIdParamDto } from '@engagement/user/shared/dto/comment-id-param.dto';
import { ReplyIdParamDto } from '@engagement/user/shared/dto/reply-id-param.dto';
import { globalControllerVersioning } from '@engagement/shared-module/constants';

@Controller({ path: 'replies', ...globalControllerVersioning })
@ApiTags('user')
export class RepliesController {
  constructor(private readonly repliesService: RepliesService) {}

  @Get(':commentId')
  @ApiBearerAuth()
  async getReplies(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: CommentIdParamDto,
    @Query() query: GetRepliesQueryDto,
  ) {
    const commentReplies = await this.repliesService.getReplies(userJWT._id, params, query);
    return new CustomResponse().success({
      payload: {
        data: commentReplies,
      },
    });
  }

  @Post(':commentId')
  @ApiBearerAuth()
  async createReply(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: CommentIdParamDto,
    @Body() body: CreateReplyDto,
  ) {
    const reply = await this.repliesService.createReply(userJWT._id, params, body);
    return new CustomResponse().success({
      payload: {
        data: reply,
      },
    });
  }

  @Patch(':replyId')
  @ApiBearerAuth()
  async updateReply(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: ReplyIdParamDto,
    @Body() body: UpdateReplyDto,
  ) {
    const reply = await this.repliesService.updateReply(userJWT._id, params, body);
    return new CustomResponse().success({
      payload: {
        data: reply,
      },
    });
  }

  @Delete(':replyId')
  @ApiBearerAuth()
  async deleteReply(@Persona() userJWT: UserJwtPersona, @Param() params: ReplyIdParamDto) {
    await this.repliesService.deleteReply(userJWT._id, params);
    return new CustomResponse().success({});
  }
}
