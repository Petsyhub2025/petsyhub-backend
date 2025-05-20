import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { UserModule } from '@inventory/user/user.module';
import { AdminModule } from '@inventory/admin/admin.module';
import { ServiceProviderModule } from '@inventory/serviceprovider/service-provider.module';

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
        appShortName: 'inventory',
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
