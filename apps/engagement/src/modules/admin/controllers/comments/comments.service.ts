import { errorManager } from '@engagement/admin/shared/config/errors.config';
import { CommentIdParamDto } from '@engagement/admin/shared/dto/comment-id-param.dto';
import { getCommentPipeLine } from '@engagement/admin/shared/helpers/shared-pipeline.helper';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  Comment,
  CommentAdminRpcPayload,
  ICommentModel,
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
import { GetCommentsQueryDto } from './dto/get-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
  ) {}

  async suspendComment(adminId: string, { commentId }: CommentIdParamDto) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }
    await comment.suspendDoc();
  }

  async unSuspendComment(adminId: string, { commentId }: CommentIdParamDto) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }
    await comment.unSuspendDoc();
  }

  async deleteComment(adminId: string, { commentId }: CommentIdParamDto) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }

    await comment.deleteDoc();
  }

  async getComments(
    adminId: string,
    { page, limit, search, authorUserId, postId }: GetCommentsQueryDto,
  ): Promise<ResponsePayload<Comment>> {
    if (search) {
      return this.getSearchedComments({ page, limit, search, authorUserId, postId });
    }
    const matchStage = [
      {
        $match: {
          ...(postId ? { post: new Types.ObjectId(postId) } : {}),
          ...(authorUserId ? { authorUser: new Types.ObjectId(authorUserId) } : {}),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.commentModel.aggregate(matchStage).count('total'),
      this.commentModel.aggregate([...matchStage, ...addPaginationStages({ page, limit }), ...getCommentPipeLine()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedComments({
    page,
    limit,
    search,
    authorUserId,
    postId,
  }: GetCommentsQueryDto): Promise<ResponsePayload<Comment>> {
    const payload: CommentAdminRpcPayload = {
      page,
      limit,
      search,
      postId,
      authorUserId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_COMMENTS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.commentModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getCommentPipeLine(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getCommentById(adminId: string, { commentId }: CommentIdParamDto) {
    const [comment] = await this.commentModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(commentId),
        },
      },
      ...getCommentPipeLine(),
    ]);
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }

    return comment;
  }
}
