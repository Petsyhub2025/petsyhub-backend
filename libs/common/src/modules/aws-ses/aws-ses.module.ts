import { SESClient } from '@aws-sdk/client-ses';
import { DynamicModule, Logger, Module, OnApplicationShutdown, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AWS_SES_CLIENT } from './constants';
import { AwsSESModuleAsyncOptions } from './interfaces';
import { awsSESDriverProvider, createAwsSESAsyncOptionProviders } from './providers';
import { AwsSESService } from './services';

@Module({})
export class AwsSESModule implements OnApplicationShutdown {
  constructor(private moduleRef: ModuleRef) {}

  static registerAsync(options: AwsSESModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for AwsSESModule: useFactory is required');

    const providers: Provider[] = [createAwsSESAsyncOptionProviders(options), awsSESDriverProvider, AwsSESService];

    return {
      module: AwsSESModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [AwsSESService],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const client = this.moduleRef.get<SESClient>(AWS_SES_CLIENT);
    client.destroy();
    new Logger('AwsSESModule').log('AwsSES client destroyed successfully');
  }
}
