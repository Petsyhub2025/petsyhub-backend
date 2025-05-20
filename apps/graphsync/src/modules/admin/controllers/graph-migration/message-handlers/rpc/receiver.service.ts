import { Injectable } from '@nestjs/common';
import {
  IGraphSyncMigrateRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { RpcHandlerService } from './handler.service';

@Injectable()
export class RpcReceiverService {
  constructor(private readonly handlerService: RpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.GRAPH_SYNC_RPC_MIGRATE_MODEL,
    queue: RabbitQueues.GRAPH_SYNC_RPC_MIGRATE_MODEL,
    queueOptions: {
      durable: true,
    },
  })
  async migrateModel(data: IGraphSyncMigrateRpcPayload) {
    return this.handlerService.migrateModel(data);
  }
}
