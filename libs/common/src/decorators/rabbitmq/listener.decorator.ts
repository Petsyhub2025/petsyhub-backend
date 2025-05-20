import { ListenerError } from '@common/classes/rabbitmq';
import { RabbitExchanges, RabbitQueues, RabbitRoutingKeys } from '@common/constants';
import { RabbitHandlerConfig, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';

interface ICustomRabbitListenerConfig
  extends Pick<
    RabbitHandlerConfig,
    | 'name'
    | 'connection'
    | 'createQueueIfNotExists'
    | 'assertQueueErrorHandler'
    | 'queueOptions'
    | 'allowNonJsonMessages'
  > {
  requeue?: boolean;
  exchange: RabbitExchanges;
  routingKey?: RabbitRoutingKeys;
  queue?: RabbitQueues;
}

export function Listen(config: ICustomRabbitListenerConfig) {
  return RabbitSubscribe({
    ...config,
    errorHandler: function (channel, originalMessage, error: ListenerError) {
      const { exchange, routingKey } = originalMessage.fields;

      let messageContent = originalMessage.content.toString();

      try {
        messageContent = JSON.parse(messageContent);
      } catch (error) {
        // Do nothing
      }

      const errorMessage = `[${exchange}::${routingKey || 'fanout'}] ${error?.message || 'An unknown error occurred'}`;

      const listenerError = new ListenerError({
        message: errorMessage,
        stack: error?.stack,
        error,
        details: {
          ...originalMessage,
          content: messageContent,
        },
      });

      new Logger('RabbitMQListener').error(listenerError);

      channel.nack(originalMessage, false, config.requeue ?? false);
    },
  });
}
