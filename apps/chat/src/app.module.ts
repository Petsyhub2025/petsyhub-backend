import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { UserModule } from '@chat/user/user.module';
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
        appShortName: 'chat',
        // allowMongooseGlobalPlugins: false,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
