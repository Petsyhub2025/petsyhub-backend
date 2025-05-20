import { DynamicModule, Logger, Module, OnApplicationShutdown, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AwsCognitoModuleAsyncOptions } from './interfaces';
import { awsCognitoDriverProvider, createAwsCognitoAsyncOptionProviders } from './providers';
import { AwsCognitoService } from './services';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { AWS_COGNITO_CLIENT } from './constants';

@Module({})
export class AwsCognitoModule implements OnApplicationShutdown {
  constructor(private moduleRef: ModuleRef) {}

  static registerAsync(options: AwsCognitoModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for AwsCognitoModule: useFactory is required');

    const providers: Provider[] = [
      createAwsCognitoAsyncOptionProviders(options),
      awsCognitoDriverProvider,
      AwsCognitoService,
    ];

    return {
      module: AwsCognitoModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [AwsCognitoService],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const client = this.moduleRef.get<CognitoIdentityClient>(AWS_COGNITO_CLIENT);
    client.destroy();
    new Logger('AwsCognitoModule').log('AwsCognito client destroyed successfully');
  }
}
