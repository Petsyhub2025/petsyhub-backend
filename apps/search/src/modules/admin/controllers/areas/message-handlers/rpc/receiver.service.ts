import { Injectable } from '@nestjs/common';
import { AreaAdminRpcPayload, RPC, RabbitExchanges, RabbitQueues, RabbitRoutingKeys } from '@instapets-backend/common';
import { AreaRpcHandlerService } from './handler.service';

@Injectable()
export class AreaRpcReceiverService {
  constructor(private readonly areaRpcHandlerService: AreaRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_AREAS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_AREAS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getAreasSearchData(data: AreaAdminRpcPayload) {
    return this.areaRpcHandlerService.getAreasSearchData(data);
  }
}
