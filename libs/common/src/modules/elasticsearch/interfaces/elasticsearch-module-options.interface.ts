import { ModuleMetadata } from '@nestjs/common';

export interface ElasticsearchModuleOptions {
  connectionString: string;
}

export interface ElasticsearchModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => ElasticsearchModuleOptions | Promise<ElasticsearchModuleOptions>;
  inject: any[];
}
