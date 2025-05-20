import { SwaggerModuleConfig } from './swagger-module-config.interface';

export interface BootstrapOptions {
  enableSocket?: boolean;
  swagger: SwaggerModuleConfig;
}
