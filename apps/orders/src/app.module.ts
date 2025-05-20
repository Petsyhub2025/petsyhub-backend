import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { CustomerModule } from '@orders/customer/customer.module';
import { ServiceProviderModule } from '@orders/serviceprovider/serviceprovider.module';
import { AdminModule } from '@orders/admin/admin.module';

@Module({
  imports: [
    CustomerModule,
    ServiceProviderModule,
    AdminModule,
    RouterModule.register([{ path: 'customer', module: CustomerModule }]),
    RouterModule.register([{ path: 'serviceprovider', module: ServiceProviderModule }]),
    RouterModule.register([{ path: 'admin', module: AdminModule }]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'orders',
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
