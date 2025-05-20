import { DynamicModule, Logger, Module, OnApplicationShutdown, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AwsLambdaModuleAsyncOptions } from './interfaces';
import { awsLambdaDriverProvider, createAwsLambdaAsyncOptionProviders } from './providers';
import { AwsLambdaService } from './services';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { AWS_LAMBDA_CLIENT } from './constants';

@Module({})
export class AwsLambdaModule implements OnApplicationShutdown {
  constructor(private moduleRef: ModuleRef) {}

  static registerAsync(options: AwsLambdaModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for AwsLambdaModule: useFactory is required');

    const providers: Provider[] = [
      createAwsLambdaAsyncOptionProviders(options),
      awsLambdaDriverProvider,
      AwsLambdaService,
    ];

    return {
      module: AwsLambdaModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [AwsLambdaService],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const client = this.moduleRef.get<LambdaClient>(AWS_LAMBDA_CLIENT);
    client.destroy();
    new Logger('AwsLambdaModule').log('AwsLambda client destroyed successfully');
  }
}
