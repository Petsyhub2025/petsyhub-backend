import { FactoryProvider, Logger, ValueProvider } from '@nestjs/common';
import { AWS_S3_CLIENT, AWS_S3_MODULE_OPTIONS } from '../constants';
import { S3Client } from '@aws-sdk/client-s3';
import { AwsS3ModuleAsyncOptions, AwsS3ModuleOptions } from '../interfaces';

export const createAwsS3AsyncOptionProviders = (options: AwsS3ModuleAsyncOptions): FactoryProvider => {
  return {
    provide: AWS_S3_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const awsS3DriverProvider: FactoryProvider<S3Client> = {
  provide: AWS_S3_CLIENT,
  useFactory: (options: AwsS3ModuleOptions) => {
    const logger = new Logger('AwsS3Module');

    const client = new S3Client({
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      region: options.region,
    });

    logger.log('S3 client created');

    return client;
  },
  inject: [AWS_S3_MODULE_OPTIONS],
};
