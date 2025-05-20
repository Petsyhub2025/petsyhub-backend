import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppConfig, CommonModule, ElasticSearchHealthService, ElasticsearchModule } from '@instapets-backend/common';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    AdminModule,
    RouterModule.register([{ path: 'admin', module: AdminModule }]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'elasticsync',
        allowMongooseGlobalPlugins: false,
      },
      useFactory: {
        default: (elasticsearchHealthService: ElasticSearchHealthService) => ({
          memoryConfig: {
            minHeapSizeInBytes: 512 * 1024 * 1024,
            maxHeapSizeInBytes: 4096 * 1024 * 1024,
          },
          healthChecks: {
            elasticsearch: () => elasticsearchHealthService.isHealthy(),
          },
        }),
      },
      inject: {
        default: [ElasticSearchHealthService],
      },
    }),
    ElasticsearchModule.registerAsync({
      imports: [],
      useFactory: async (appConfig: AppConfig) => ({
        connectionString: appConfig.ELASTIC_SEARCH_URL,
      }),
      inject: [AppConfig],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
