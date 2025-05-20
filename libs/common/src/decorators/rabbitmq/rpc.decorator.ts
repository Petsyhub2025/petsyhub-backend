import { RpcError, RpcResponse } from '@common/classes/rabbitmq';
import { RabbitExchanges, RabbitRoutingKeys, RabbitQueues } from '@common/constants';
import { RabbitHandlerConfig, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';

interface ICustomRabbitRpcConfig
  extends Pick<
    RabbitHandlerConfig,
    | 'name'
    | 'connection'
    | 'createQueueIfNotExists'
    | 'assertQueueErrorHandler'
    | 'queueOptions'
    | 'allowNonJsonMessages'
  > {
  exchange: RabbitExchanges;
  routingKey?: RabbitRoutingKeys;
  queue?: RabbitQueues;
}

export function RPC(config: ICustomRabbitRpcConfig) {
  return RabbitRPC({
    ...config,
    errorHandler: function (channel, originalMessage, error: RpcError) {
      const { replyTo, correlationId } = originalMessage.properties;
      const { exchange, routingKey } = originalMessage.fields;

      if (replyTo) {
        let messageContent = originalMessage.content.toString();

        try {
          messageContent = JSON.parse(messageContent);
        } catch (error) {
          // Do nothing
        }

        const errorMessage = `[${exchange}::${routingKey || 'fanout'}] ${
          error?.message || 'An unknown error occurred'
        }`;

        const rpcError = RpcResponse.error({
          message: errorMessage,
          stack: error?.stack,
          error,
          details: {
            ...originalMessage,
            content: messageContent,
          },
        });
        const serializedRpcError = Buffer.from(JSON.stringify(rpcError));

        new Logger('RpcError').error(rpcError);

        channel.publish('', replyTo, serializedRpcError, { correlationId });
        channel.ack(originalMessage);
      }
    },
  });
}
