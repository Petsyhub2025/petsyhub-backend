import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { AdminModule } from '@branches/admin/admin.module';
import { UserModule } from '@branches/user/user.module';
import { ServiceProviderModule } from '@branches/serviceprovider/service-provider.module';
import { CustomerModule } from '@branches/customer/customer.module';

@Module({
  imports: [
    ServiceProviderModule,
    UserModule,
    AdminModule,
    CustomerModule,
    RouterModule.register([
      { path: 'admin', module: AdminModule },
      { path: 'user', module: UserModule },
      { path: 'serviceprovider', module: ServiceProviderModule },
      { path: 'customer', module: CustomerModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'branches',
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
