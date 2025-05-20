import { Injectable } from '@nestjs/common';
import { AdminAdminRpcPayload, RPC, RabbitExchanges, RabbitQueues, RabbitRoutingKeys } from '@instapets-backend/common';
import { AdminsRpcHandlerService } from './handler.service';

@Injectable()
export class AdminsRpcReceiverService {
  constructor(private readonly adminsRpcHandlerService: AdminsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_ADMINS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_ADMINS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getAdminsSearchData(data: AdminAdminRpcPayload) {
    return this.adminsRpcHandlerService.getAdminsSearchData(data);
  }
}
