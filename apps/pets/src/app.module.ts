import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppConfig, CommonModule, Neo4jModule } from '@instapets-backend/common';
import { UserModule } from '@pets/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { ServiceProviderModule } from './modules/service-provider/service-provider.module';

@Module({
  imports: [
    UserModule,
    AdminModule,
    ServiceProviderModule,
    RouterModule.register([
      { path: 'admin', module: AdminModule },
      { path: 'user', module: UserModule },
      { path: 'serviceprovider', module: ServiceProviderModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'pets',
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
    Neo4jModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        connectionString: appConfig.NEO4J_DB_URL,
        auth: {
          password: appConfig.NEO4J_PASSWORD,
          user: appConfig.NEO4J_USER,
        },
      }),
      inject: [AppConfig],
    }),
  ],
})
export class AppModule {}
