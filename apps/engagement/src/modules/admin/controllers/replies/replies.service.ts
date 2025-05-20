import { errorManager } from '@engagement/admin/shared/config/errors.config';
import { ReplyIdParamDto } from '@engagement/admin/shared/dto/reply-id-param.dto';
import { getRepliesPipeline } from '@engagement/admin/shared/helpers/shared-pipeline.helper';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  CommentReply,
  CommentReplyAdminRpcPayload,
  ICommentReplyModel,
  ISearchResponseData,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { GetRepliesQueryDto } from './dto/get-replies.dto';

@Injectable()
export class RepliesService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
  ) {}

  async suspendReply(adminId: string, { replyId }: ReplyIdParamDto) {
    const reply = await this.commentReplyModel.findById(replyId);
    if (!reply) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }
    await reply.suspendDoc();
  }

  async unSuspendReply(adminId: string, { replyId }: ReplyIdParamDto) {
    const reply = await this.commentReplyModel.findById(replyId);
    if (!reply) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }
    await reply.unSuspendDoc();
  }

  async deleteReply(adminId: string, { replyId }: ReplyIdParamDto) {
    const reply = await this.commentReplyModel.findById(replyId);
    if (!reply) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }

    await reply.deleteDoc();
  }

  async getReplies(adminId: string, query: GetRepliesQueryDto): Promise<ResponsePayload<CommentReply>> {
    const { page, limit, search, commentId, postId, authorUserId } = query;

    if (search) {
      return this.getSearchedReplies(query);
    }
    const matchStage = [
      {
        $match: {
          ...(postId ? { post: new Types.ObjectId(postId) } : {}),
          ...(authorUserId ? { authorUser: new Types.ObjectId(authorUserId) } : {}),
          ...(commentId ? { replyOn: new Types.ObjectId(commentId) } : {}),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.commentReplyModel.aggregate(matchStage).count('total'),
      this.commentReplyModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...getRepliesPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedReplies({
    page,
    limit,
    search,
    commentId,
    postId,
    authorUserId,
  }: GetRepliesQueryDto): Promise<ResponsePayload<CommentReply>> {
    const payload: CommentReplyAdminRpcPayload = {
      page,
      limit,
      search,
      postId,
      authorUserId,
      replyOn: commentId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_COMMENT_REPLIES_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.commentReplyModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getRepliesPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getReplyById(adminId: string, { replyId }: ReplyIdParamDto) {
    const [reply] = await this.commentReplyModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(replyId),
        },
      },
      ...getRepliesPipeline(),
    ]);
    if (!reply) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }

    return reply;
  }
}
