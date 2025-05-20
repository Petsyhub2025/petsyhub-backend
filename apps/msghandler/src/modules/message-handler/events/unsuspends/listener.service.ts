import { Injectable } from '@nestjs/common';
import { UnSuspendsHandlerService } from './handler.service';
import { IUnsuspendEvent, Listen, RabbitExchanges, RabbitQueues, RabbitRoutingKeys } from '@instapets-backend/common';

@Injectable()
export class UnSuspendsListenerService {
  constructor(private readonly unSuspendsHandlerService: UnSuspendsHandlerService) {}

  @Listen({
    exchange: RabbitExchanges.MESSAGE_WORKER,
    routingKey: RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_USER,
    queue: RabbitQueues.MESSAGE_WORKER_EVENTS_UNSUSPEND_USER,
    queueOptions: {
      durable: true,
    },
  })
  async unSuspendUser(data: IUnsuspendEvent) {
    await this.unSuspendsHandlerService.unSuspendUser(data);
  }

  @Listen({
    exchange: RabbitExchanges.MESSAGE_WORKER,
    routingKey: RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_POST,
    queue: RabbitQueues.MESSAGE_WORKER_EVENTS_UNSUSPEND_POST,
    queueOptions: {
      durable: true,
    },
  })
  async unSuspendPost(data: IUnsuspendEvent) {
    await this.unSuspendsHandlerService.unSuspendPost(data);
  }

  @Listen({
    exchange: RabbitExchanges.MESSAGE_WORKER,
    routingKey: RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_COMMENT,
    queue: RabbitQueues.MESSAGE_WORKER_EVENTS_UNSUSPEND_COMMENT,
    queueOptions: {
      durable: true,
    },
  })
  async unSuspendComment(data: IUnsuspendEvent) {
    await this.unSuspendsHandlerService.unSuspendComment(data);
  }
}
