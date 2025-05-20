import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';
import { filterSoftDeletePlugin } from '@common/plugins/soft-delete';
import { RedisModule, RedisModuleOptions } from '@songkeys/nestjs-redis';
import { ReadConcernLevel, ReadPreferenceMode } from 'mongodb';
import { Connection } from 'mongoose';
import { rabbitMQMainConfig } from './constants/rabbitmq-main-config.constant';
import { HealthController } from './controllers';
import { ExceptionFilter } from './filters';
import { AdminPermissionGuard, ApiVersionGuard, JwtDecodeGuard, VerifyS2SJwtToken } from './guards';
import { LoggingInterceptor, WsLoggingInterceptor } from './interceptors';
import { CommonModuleAsyncOptions } from './interfaces';
import { createAsyncProviders } from './providers';
import { CustomLoggerService } from './services/logger';
import { WsExceptionFilter } from './filters/ws-exception.filter';
import { NotificationsHelperService } from '@common/helpers/services';
import { configSchema } from '@common/schemas/joi';
import { EnvConfigModule } from '@common/modules/env-config/env-config.module';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { EventListenerErrorHandlerService } from './services/event-listener-handlers';
import { MongoDbHealthService } from './services/health-checks';

@Module({})
export class CommonModule {
  static registerAsync(options: CommonModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for CommonModule: useFactory is required');

    const defaultAppConfigOptions = {
      allowMongooseGlobalPlugins: true,
    };

    const appConfigOptions = {
      ...defaultAppConfigOptions,
      ...options.appConfig,
    };

    const providers = [
      ...createAsyncProviders(options),
      MongoDbHealthService,
      EventListenerErrorHandlerService,
      CustomLoggerService,
      LoggingInterceptor,
      VerifyS2SJwtToken,
      NotificationsHelperService,
      WsExceptionFilter,
      WsLoggingInterceptor,
    ];

    const imports = [
      ...(options.imports ?? []),
      EnvConfigModule.register(appConfigOptions),
      TerminusModule,
      ConfigModule.forRoot({ isGlobal: true, validationSchema: configSchema(appConfigOptions) }),
      JwtModule.register({}),
      RabbitMQModule.forRootAsync(RabbitMQModule, {
        imports: [],
        useFactory: async (appConfig: AppConfig) => {
          return {
            ...rabbitMQMainConfig,
            uri: appConfig.RABBIT_URI,
          };
        },
        inject: [AppConfig],
      }),
      EventEmitterModule.forRoot(),
      RedisModule.forRootAsync({
        imports: [],
        inject: [AppConfig],
        useFactory: async (appConfig: AppConfig): Promise<RedisModuleOptions> => {
          return {
            config: {
              host: appConfig.REDIS_HOST ?? 'redis',
              port: appConfig.REDIS_PORT,
            },
          };
        },
      }),
      MongooseModule.forRootAsync({
        useFactory: async (appConfig: AppConfig) => {
          const specialConfigServices = ['graphsync', 'elasticsync'];
          const serviceName = appConfig.APP_SHORT_NAME;
          const isSpecialConfigService = specialConfigServices.includes(serviceName);

          const readWriteConfigMap = new Map<boolean, MongooseModuleFactoryOptions>([
            [
              true,
              {
                readPreference: ReadPreferenceMode.primary,
              },
            ],
            [
              false,
              {
                readPreference: ReadPreferenceMode.primaryPreferred,
                readConcern: { level: ReadConcernLevel.majority },
                writeConcern: { w: 'majority' },
              },
            ],
          ]);

          return {
            uri: appConfig.MONGODB_URL,
            ...readWriteConfigMap.get(isSpecialConfigService),
            connectionFactory: (connection: Connection) => {
              if (appConfigOptions.allowMongooseGlobalPlugins) {
                connection.plugin(filterSoftDeletePlugin);
              }

              return connection;
            },
          };
        },
        inject: [AppConfig],
      }),
    ];

    return {
      module: CommonModule,
      imports,
      providers: [
        ...providers,
        {
          provide: APP_FILTER,
          useClass: ExceptionFilter,
        },
        {
          provide: APP_GUARD,
          useClass: ApiVersionGuard,
        },
        {
          provide: APP_GUARD,
          useClass: JwtDecodeGuard,
        },
        {
          provide: APP_GUARD,
          useClass: AdminPermissionGuard,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: LoggingInterceptor,
        },
      ],
      exports: [...imports, ...providers],
      global: true,
      controllers: [HealthController],
    };
  }
}
