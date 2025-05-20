import { ModuleMetadata } from '@nestjs/common';
export interface AwsSchedulerModuleOptions {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface AwsSchedulerModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AwsSchedulerModuleOptions> | AwsSchedulerModuleOptions;
  inject?: any[];
}
