import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppConfig, CommonModule, ElasticSearchHealthService, ElasticsearchModule } from '@instapets-backend/common';
import { UserModule } from '@search/user/user.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    UserModule,
    AdminModule,
    RouterModule.register([
      { path: 'user', module: UserModule },
      { path: 'admin', module: AdminModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'search',
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
