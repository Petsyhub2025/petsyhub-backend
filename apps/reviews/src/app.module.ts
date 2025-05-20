import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { CustomerModule } from '@reviews/customer/customer.module';
import { AdminModule } from 'apps/reviews/src/modules/admin/admin.module';
import { ServiceProviderModule } from 'apps/reviews/src/modules/serviceprovider/service-provider.module';

@Module({
  imports: [
    ServiceProviderModule,
    CustomerModule,
    AdminModule,
    RouterModule.register([
      { path: 'admin', module: AdminModule },
      { path: 'customer', module: CustomerModule },
      { path: 'serviceprovider', module: ServiceProviderModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'reviews',
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
