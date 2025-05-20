import { ModuleMetadata } from '@nestjs/common';
export interface AwsLambdaModuleOptions {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface AwsLambdaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AwsLambdaModuleOptions> | AwsLambdaModuleOptions;
  inject?: any[];
}
