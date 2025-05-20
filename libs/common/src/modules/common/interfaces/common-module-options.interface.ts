import { ModuleMetadata } from '@nestjs/common';
import { HealthChecksConfig } from './health-checks-config.interface';
import { MemoryConfig } from './memory-config.interface';
import { AppConfigOptions } from '@common/interfaces/app-config-options';

export interface CommonModuleOptions {
  memoryConfig: MemoryConfig;
  healthChecks?: HealthChecksConfig;
}

export interface CommonModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  appConfig: AppConfigOptions;
  useFactory: {
    default: (...args: any[]) => CommonModuleOptions | Promise<CommonModuleOptions>;
  };
  inject: { default?: any[] };
}
