import { Injectable } from '@nestjs/common';
import { RPC, RabbitExchanges, RabbitQueues, RabbitRoutingKeys, BranchRpcPayload } from '@instapets-backend/common';
import { BranchRpcHandlerService } from './handler.service';

@Injectable()
export class BranchRpcReceiverService {
  constructor(private readonly branchRpcHandlerService: BranchRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_BRANCHES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_BRANCHES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getBranchesSearchData(data: BranchRpcPayload) {
    return this.branchRpcHandlerService.BranchesSearchData(data);
  }
}
