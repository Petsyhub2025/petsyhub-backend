import { FactoryProvider, Logger, ValueProvider } from '@nestjs/common';
import { AWS_SES_CLIENT, AWS_SES_MODULE_OPTIONS } from '../constants';
import { AwsSESModuleAsyncOptions, AwsSESModuleOptions } from '../interfaces';
import { SESClient } from '@aws-sdk/client-ses';

export const createAwsSESAsyncOptionProviders = (options: AwsSESModuleAsyncOptions): FactoryProvider => {
  return {
    provide: AWS_SES_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const awsSESDriverProvider: FactoryProvider<SESClient> = {
  provide: AWS_SES_CLIENT,
  useFactory: (options: AwsSESModuleOptions) => {
    const logger = new Logger('AwsSESModule');

    const client = new SESClient({
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      region: options.region,
    });

    logger.log('SES client created');

    return client;
  },
  inject: [AWS_SES_MODULE_OPTIONS],
};
