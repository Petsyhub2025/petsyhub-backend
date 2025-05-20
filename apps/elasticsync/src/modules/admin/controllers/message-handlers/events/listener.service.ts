import { Injectable } from '@nestjs/common';
import {
  IElasticSyncFieldUpdatePropagationEvent,
  Listen,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { EventsHandlerService } from './handler.service';

@Injectable()
export class EventsListenerService {
  constructor(private readonly eventsHandlerService: EventsHandlerService) {}

  @Listen({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.ELASTICSEARCH_SYNC_EVENTS_PROPAGATE_FIELD_UPDATE,
    queue: RabbitQueues.ELASTICSEARCH_SYNC_EVENTS_PROPAGATE_FIELD_UPDATE,
    queueOptions: {
      durable: true,
    },
  })
  async propagateFieldUpdate(data: IElasticSyncFieldUpdatePropagationEvent) {
    return this.eventsHandlerService.propagateFieldUpdate(data);
  }
}
