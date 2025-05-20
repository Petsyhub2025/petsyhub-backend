import { RabbitExchanges } from '@common/constants';
import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';

export const rabbitMQMainConfig: Omit<RabbitMQConfig, 'uri'> = {
  exchanges: [
    {
      name: RabbitExchanges.SYNC,
      type: 'fanout',
      options: {
        durable: true,
      },
    },
    {
      name: RabbitExchanges.SOCKET_DISCONNECTION,
      type: 'fanout',
      options: {
        durable: true,
      },
    },
    {
      name: RabbitExchanges.MESSAGE_WORKER,
      type: 'direct',
      options: {
        durable: true,
      },
    },
    {
      name: RabbitExchanges.SERVICE,
      type: 'direct',
      options: {
        durable: true,
      },
    },
  ],
  channels: {
    'main-channel': {
      default: true,
      prefetchCount: 10,
    },
  },
  connectionInitOptions: { wait: false },
  enableDirectReplyTo: true,
};
