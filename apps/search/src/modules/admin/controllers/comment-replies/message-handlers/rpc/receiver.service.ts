import { Injectable } from '@nestjs/common';
import {
  CommentReplyAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { CommentRepliesRpcHandlerService } from './handler.service';

@Injectable()
export class CommentRepliesRpcReceiverService {
  constructor(private readonly commentRepliesRpcHandlerService: CommentRepliesRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_COMMENT_REPLIES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_COMMENT_REPLIES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getCommentRepliesSearchData(data: CommentReplyAdminRpcPayload) {
    return this.commentRepliesRpcHandlerService.getCommentRepliesSearchData(data);
  }
}
