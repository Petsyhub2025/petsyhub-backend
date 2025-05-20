import { Injectable } from '@nestjs/common';
import {
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
  ServiceProviderRpcPayload,
} from '@instapets-backend/common';
import { ServiceProviderRpcHandlerService } from './handler.service';

@Injectable()
export class ServiceProviderRpcReceiverService {
  constructor(private readonly serviceProviderRpcHandlerService: ServiceProviderRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_SERVICE_PROVIDERS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_SERVICE_PROVIDERS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getServiceProvidersSearchData(data: ServiceProviderRpcPayload) {
    return this.serviceProviderRpcHandlerService.getServiceProvidersSearchData(data);
  }
}
