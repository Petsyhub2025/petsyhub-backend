import { SwaggerConfig } from './swagger-config.interface';

export interface SwaggerModuleConfig {
  enabled: boolean;
  config?: SwaggerConfig;
}
