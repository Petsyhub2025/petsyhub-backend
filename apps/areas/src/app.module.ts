import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommonModule } from '@instapets-backend/common';
import { UserModule } from '@areas/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { ServiceProviderModule } from './modules/service-provider/service-provider.module';

@Module({
  imports: [
    UserModule,
    AdminModule,
    ServiceProviderModule,
    AppModule,
    RouterModule.register([
      { path: 'admin', module: AdminModule },
      { path: 'user', module: UserModule },
      { path: 'serviceprovider', module: ServiceProviderModule },
    ]),
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'areas',
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
