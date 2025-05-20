import { ModuleMetadata } from '@nestjs/common';
export interface AwsS3ModuleOptions {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface AwsS3ModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AwsS3ModuleOptions> | AwsS3ModuleOptions;
  inject?: any[];
}
