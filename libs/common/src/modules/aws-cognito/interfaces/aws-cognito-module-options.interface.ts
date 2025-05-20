import { ModuleMetadata } from '@nestjs/common';
export interface AwsCognitoModuleOptions {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  identityPoolId: string;
  developerIdentityId: string;
}

export interface AwsCognitoModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AwsCognitoModuleOptions> | AwsCognitoModuleOptions;
  inject?: any[];
}
