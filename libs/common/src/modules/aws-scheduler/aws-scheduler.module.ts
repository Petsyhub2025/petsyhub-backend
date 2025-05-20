import { DynamicModule, Logger, Module, OnApplicationShutdown, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AwsSchedulerModuleAsyncOptions } from './interfaces';
import { awsSchedulerDriverProvider, createAwsSchedulerAsyncOptionProviders } from './providers';
import { AwsSchedulerService } from './services';
import { SchedulerClient } from '@aws-sdk/client-scheduler';
import { AWS_SCHEDULER_CLIENT } from './constants';

@Module({})
export class AwsSchedulerModule implements OnApplicationShutdown {
  constructor(private moduleRef: ModuleRef) {}

  static registerAsync(options: AwsSchedulerModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for AwsSchedulerModule: useFactory is required');

    const providers: Provider[] = [
      createAwsSchedulerAsyncOptionProviders(options),
      awsSchedulerDriverProvider,
      AwsSchedulerService,
    ];

    return {
      module: AwsSchedulerModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [AwsSchedulerService],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const client = this.moduleRef.get<SchedulerClient>(AWS_SCHEDULER_CLIENT);
    client.destroy();
    new Logger('AwsSchedulerModule').log('AwsScheduler client destroyed successfully');
  }
}
