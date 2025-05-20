import { FactoryProvider, Logger, ValueProvider } from '@nestjs/common';
import { AWS_LAMBDA_CLIENT, AWS_LAMBDA_MODULE_OPTIONS } from '@common/modules/aws-lambda/constants';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { AwsLambdaModuleAsyncOptions, AwsLambdaModuleOptions } from '@common/modules/aws-lambda/interfaces';

export const createAwsLambdaAsyncOptionProviders = (options: AwsLambdaModuleAsyncOptions): FactoryProvider => {
  return {
    provide: AWS_LAMBDA_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const awsLambdaDriverProvider: FactoryProvider<LambdaClient> = {
  provide: AWS_LAMBDA_CLIENT,
  useFactory: (options: AwsLambdaModuleOptions) => {
    const logger = new Logger('AwsLambdaModule');

    const client = new LambdaClient({
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      region: options.region,
    });

    logger.log('Lambda client created');

    return client;
  },
  inject: [AWS_LAMBDA_MODULE_OPTIONS],
};
