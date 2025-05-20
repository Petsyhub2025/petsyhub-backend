import { RabbitExchanges } from '@common/constants';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { CustomLoggerService } from '@common/modules/common/services/logger';
import { EnvConfigModule } from '@common/modules/env-config/env-config.module';
import { filterSoftDeletePlugin } from '@common/plugins/soft-delete';
import { RabbitMQConfig, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { RedisModule, RedisModuleOptions } from '@songkeys/nestjs-redis';
import { TestingContainers } from '@testing/constants';
import { useContainer } from 'class-validator';
import { ReadConcernLevel, ReadPreferenceMode } from 'mongodb';
import { Connection } from 'mongoose';
import { Constructable } from '../interfaces';

class MinifiedCommonModule {
  static forRoot() {
    const providers = [EventListenerErrorHandlerService, CustomLoggerService];
    const imports = [
      EventEmitterModule.forRoot(),
      EnvConfigModule.register({
        appShortName: 'testing-app',
      }),
      RedisModule.forRootAsync({
        imports: [],
        inject: [],
        useFactory: async (): Promise<RedisModuleOptions> => {
          return {
            config: {
              host: TestingContainers.redis.host,
              port: TestingContainers.redis.port,
            },
          };
        },
      }),
      RabbitMQModule.forRootAsync(RabbitMQModule, {
        imports: [],
        inject: [],
        useFactory: async (): Promise<RabbitMQConfig> => {
          return {
            exchanges: [
              {
                name: RabbitExchanges.SYNC,
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
            uri: TestingContainers.rabbitmq.uri,
          };
        },
      }),
    ];

    return {
      module: MinifiedCommonModule,
      imports: [...imports],
      providers: providers,
      exports: [...imports, ...providers],
      global: true,
    };
  }
}

export async function createTestingModule({
  controllers = [],
  services = [],
  modules = [],
}: {
  controllers?: Constructable[];
  services?: Constructable[];
  modules?: Constructable[];
}) {
  const testingModule = await Test.createTestingModule({
    controllers,
    providers: [...services],
    imports: [
      ...modules,
      MinifiedCommonModule.forRoot(),
      MongooseModule.forRootAsync({
        imports: [],
        inject: [],
        useFactory: async () => ({
          uri: TestingContainers.mongodb.uri,
          readPreference: ReadPreferenceMode.primaryPreferred,
          readConcern: { level: ReadConcernLevel.majority },
          writeConcern: { w: 'majority' },
          connectionFactory: (connection: Connection) => {
            connection.plugin(filterSoftDeletePlugin);
            return connection;
          },
        }),
      }),
    ],
  }).compile();

  // For dependency injection in class-validator
  useContainer(testingModule, { fallbackOnErrors: true });

  return testingModule;
}
