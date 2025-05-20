import { DynamicModule, Logger, Module, OnApplicationShutdown, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AwsS3ModuleAsyncOptions } from './interfaces';
import { awsS3DriverProvider, createAwsS3AsyncOptionProviders } from './providers';
import { AwsS3Service } from './services';
import { S3Client } from '@aws-sdk/client-s3';
import { AWS_S3_CLIENT } from './constants';

@Module({})
export class AwsS3Module implements OnApplicationShutdown {
  constructor(private moduleRef: ModuleRef) {}

  static registerAsync(options: AwsS3ModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for AwsS3Module: useFactory is required');

    const providers: Provider[] = [createAwsS3AsyncOptionProviders(options), awsS3DriverProvider, AwsS3Service];

    return {
      module: AwsS3Module,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [AwsS3Service],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const client = this.moduleRef.get<S3Client>(AWS_S3_CLIENT);
    client.destroy();
    new Logger('AwsS3Module').log('AwsS3 client destroyed successfully');
  }
}
