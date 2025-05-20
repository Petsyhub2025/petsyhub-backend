import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppConfig, CommonModule } from '@instapets-backend/common';
import { AdminModule } from './modules/admin/admin.module';
import { RedisModule, RedisModuleOptions } from '@songkeys/nestjs-redis';
import { UserModule } from '@admins/user/user.module';

@Module({
  imports: [
    UserModule,
    AdminModule,
    AppModule,
    RouterModule.register([
      { path: 'admin', module: AdminModule },
      { path: 'user', module: UserModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'admins',
      },
      useFactory: {
        default: () => ({
          memoryConfig: {
            minHeapSizeInBytes: 512 * 1024 * 1024,
            maxHeapSizeInBytes: 4096 * 1024 * 1024,
          },
        }),
      },
      inject: {
        default: [],
      },
    }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
