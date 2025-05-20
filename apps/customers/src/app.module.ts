import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { CustomerModule } from '@customers/customer/customer.module';
import { ServiceProviderModule } from '@customers/serviceprovider/serviceprovider.module';

@Module({
  imports: [
    CustomerModule,
    ServiceProviderModule,
    RouterModule.register([{ path: 'customer', module: CustomerModule }]),
    RouterModule.register([{ path: 'serviceprovider', module: ServiceProviderModule }]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'customers',
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
