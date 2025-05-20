import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { UserModule } from '@serviceproviders/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { ServiceProviderModule } from './modules/serviceprovider/service-provider.module';

@Module({
  imports: [
    ServiceProviderModule,
    UserModule,
    AdminModule,
    RouterModule.register([
      { path: 'admin', module: AdminModule },
      { path: 'user', module: UserModule },
      { path: 'serviceprovider', module: ServiceProviderModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'serviceproviders',
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
