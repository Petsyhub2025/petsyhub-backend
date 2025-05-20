import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { AWS_COGNITO_CLIENT, AWS_COGNITO_MODULE_OPTIONS } from '@common/modules/aws-cognito/constants';
import { AwsCognitoModuleAsyncOptions, AwsCognitoModuleOptions } from '@common/modules/aws-cognito/interfaces';
import { FactoryProvider, Logger } from '@nestjs/common';

export const createAwsCognitoAsyncOptionProviders = (options: AwsCognitoModuleAsyncOptions): FactoryProvider => {
  return {
    provide: AWS_COGNITO_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const awsCognitoDriverProvider: FactoryProvider<CognitoIdentityClient> = {
  provide: AWS_COGNITO_CLIENT,
  useFactory: (options: AwsCognitoModuleOptions) => {
    const logger = new Logger('AwsCognitoModule');

    const client = new CognitoIdentityClient({
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      region: options.region,
    });

    logger.log('Cognito client created');

    return client;
  },
  inject: [AWS_COGNITO_MODULE_OPTIONS],
};
