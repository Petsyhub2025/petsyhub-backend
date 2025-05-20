import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppConfig, CommonModule, Neo4jModule } from '@instapets-backend/common';
import { UserModule } from '@discovery/user/user.module';

@Module({
  imports: [
    UserModule,
    RouterModule.register([{ path: 'user', module: UserModule }]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'discovery',
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
          user: appConfig.NEO4J_USER,
          password: appConfig.NEO4J_PASSWORD,
        },
      }),
      inject: [AppConfig],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
