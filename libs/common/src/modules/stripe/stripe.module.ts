import { SESClient } from '@aws-sdk/client-ses';
import { DynamicModule, Logger, Module, OnApplicationShutdown, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { STRIPE_CLIENT } from './constants';
import { StripeModuleAsyncOptions } from './interfaces';
import { stripeDriverProvider, createStripeAsyncOptionProviders } from './providers';
import { StripeService } from './services';

@Module({})
export class StripeModule implements OnApplicationShutdown {
  constructor(private moduleRef: ModuleRef) {}

  static registerAsync(options: StripeModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for StripeModule: useFactory is required');

    const providers: Provider[] = [createStripeAsyncOptionProviders(options), stripeDriverProvider, StripeService];

    return {
      module: StripeModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [StripeService],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const client = this.moduleRef.get<SESClient>(STRIPE_CLIENT);
    client.destroy();
    new Logger('StripeModule').log('Stripe client destroyed successfully');
  }
}
