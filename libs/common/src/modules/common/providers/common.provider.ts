import { Provider } from '@nestjs/common';
import { COMMON_MODULE_OPTIONS, HEALTH_CHECK_FUNCTIONS, MEMORY_CONFIG } from '../constants/common.constant';
import { CommonModuleAsyncOptions, CommonModuleOptions, MemoryConfig } from '../interfaces';
import { HealthChecksConfig } from '../interfaces/health-checks-config.interface';

export const createAsyncProviders = (options: CommonModuleAsyncOptions): Provider[] => {
  return [
    {
      provide: COMMON_MODULE_OPTIONS,
      useFactory: options.useFactory.default,
      inject: options.inject.default ?? [],
    },
    {
      provide: MEMORY_CONFIG,
      useFactory: (options: CommonModuleOptions): MemoryConfig => options.memoryConfig,
      inject: [COMMON_MODULE_OPTIONS],
    },
    {
      provide: HEALTH_CHECK_FUNCTIONS,
      useFactory: (options: CommonModuleOptions): HealthChecksConfig => options.healthChecks,
      inject: [COMMON_MODULE_OPTIONS],
    },
  ];
};
