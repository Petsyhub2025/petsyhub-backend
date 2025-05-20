import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { UserModule } from './modules/user/user.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    AppModule,
    UserModule,
    AdminModule,
    RouterModule.register([
      { path: 'admin', module: AdminModule },
      { path: 'user', module: UserModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'topics',
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
