import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppConfig, CommonModule, Neo4jModule } from '@instapets-backend/common';
import { UserModule } from '@graphsync/user/user.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    UserModule,
    AdminModule,
    AppModule,
    RouterModule.register([
      { path: 'user', module: UserModule },
      { path: 'admin', module: AdminModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'graphsync',
        allowMongooseGlobalPlugins: false,
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
  controllers: [],
  providers: [],
})
export class AppModule {}
