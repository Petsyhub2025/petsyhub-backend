import { Injectable } from '@nestjs/common';
import {
  CommentAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { CommentsRpcHandlerService } from './handler.service';

@Injectable()
export class CommentsRpcReceiverService {
  constructor(private readonly commentsRpcHandlerService: CommentsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_COMMENTS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_COMMENTS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getCommentsSearchData(data: CommentAdminRpcPayload) {
    return this.commentsRpcHandlerService.getCommentsSearchData(data);
  }
}
