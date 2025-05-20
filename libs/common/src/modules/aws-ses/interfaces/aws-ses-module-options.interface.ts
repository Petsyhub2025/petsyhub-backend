import { ModuleMetadata } from '@nestjs/common';
export interface AwsSESModuleOptions {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface AwsSESModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AwsSESModuleOptions> | AwsSESModuleOptions;
  inject?: any[];
}
