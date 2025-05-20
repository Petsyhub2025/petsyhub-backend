import { Injectable } from '@nestjs/common';
import { CityAdminRpcPayload, RPC, RabbitExchanges, RabbitQueues, RabbitRoutingKeys } from '@instapets-backend/common';
import { CityRpcHandlerService } from './handler.service';

@Injectable()
export class CityRpcReceiverService {
  constructor(private readonly cityRpcHandlerService: CityRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_CITIES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_CITIES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getCitiesSearchData(data: CityAdminRpcPayload) {
    return this.cityRpcHandlerService.getCitiesSearchData(data);
  }
}
