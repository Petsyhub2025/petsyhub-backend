import { ModuleMetadata } from '@nestjs/common';
export interface Neo4jModuleOptions {
  connectionString?: string;
  auth?: {
    user: string;
    password: string;
  };
  driverOptions?: {
    loggingLevel?: 'error' | 'warn' | 'info' | 'debug';
  };
}

export interface Neo4jModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<Neo4jModuleOptions> | Neo4jModuleOptions;
  inject?: any[];
}
