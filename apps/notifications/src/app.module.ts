import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppConfig, CommonModule, EnvironmentEnum, FCMModule } from '@instapets-backend/common';
import { UserModule } from '@notifications/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { ServiceProviderModule } from './modules/service-provider/service-provider.module';

@Module({
  imports: [
    UserModule,
    AdminModule,
    ServiceProviderModule,
    AppModule,
    RouterModule.register([
      { path: 'user', module: UserModule },
      { path: 'admin', module: AdminModule },
      { path: 'serviceprovider', module: ServiceProviderModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'notifications',
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
    FCMModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        firebaseEnv: appConfig.NODE_ENV as EnvironmentEnum,
      }),
      inject: [AppConfig],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
