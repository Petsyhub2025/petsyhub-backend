import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FCMModuleAsyncOptions, FCMModuleOptions } from './interfaces';
import {
  createFCMAsyncOptionProviders,
  createFCMOptionsProvider,
  fcmAdminAppProvider,
  fcmMergedOptionsProvider,
  fcmServiceProviderAppProvider,
  fcmUserAppProvider,
} from './providers';
import { UserFCMService } from './services/user-fcm.service';
import { AdminFCMService, ServiceProviderFCMService } from './services';

@Module({})
export class FCMModule {
  static register(options: FCMModuleOptions): DynamicModule {
    const providers: Provider[] = [
      createFCMOptionsProvider(options),
      fcmMergedOptionsProvider,
      fcmUserAppProvider,
      fcmAdminAppProvider,
      fcmServiceProviderAppProvider,
      UserFCMService,
      AdminFCMService,
      ServiceProviderFCMService,
    ];

    return {
      module: FCMModule,
      global: true,
      providers,
      exports: [UserFCMService, AdminFCMService, ServiceProviderFCMService],
    };
  }

  static registerAsync(options: FCMModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for FCMModule: useFactory is required');

    const providers: Provider[] = [
      createFCMAsyncOptionProviders(options),
      fcmMergedOptionsProvider,
      fcmUserAppProvider,
      fcmAdminAppProvider,
      fcmServiceProviderAppProvider,
      UserFCMService,
      AdminFCMService,
      ServiceProviderFCMService,
    ];

    return {
      module: FCMModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [UserFCMService, AdminFCMService, ServiceProviderFCMService],
    };
  }
}
