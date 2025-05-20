import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { AdminModule } from '@products/admin/admin.module';
import { ServiceProviderModule } from '@products/serviceprovider/service-provider.module';
import { CustomerModule } from '@products/customer/customer.module';

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
        appShortName: 'products',
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
