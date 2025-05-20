import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { BranchServiceTypesRpcHandlerService } from './handler.service';

@Injectable()
export class BranchServiceTypesRpcReceiverService {
  constructor(private readonly branchServiceTypesRpcHandlerService: BranchServiceTypesRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_BRANCH_SERVICE_TYPES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_BRANCH_SERVICE_TYPES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getBranchServiceTypesSearchData(data: BaseSearchPaginationQuery) {
    return this.branchServiceTypesRpcHandlerService.getBranchServiceTypesSearchData(data);
  }
}
