import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { CountryRpcHandlerService } from './handler.service';

@Injectable()
export class CountryRpcReceiverService {
  constructor(private readonly countryRpcHandlerService: CountryRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_COUNTRIES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_COUNTRIES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getCountriesSearchData(data: BaseSearchPaginationQuery) {
    return this.countryRpcHandlerService.getCountriesSearchData(data);
  }
}
