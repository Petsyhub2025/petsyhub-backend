import { AppConfigOptions } from '@common/interfaces/app-config-options';
import { configSchema } from '@common/schemas/joi';
import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from './services/app-config';

export class EnvConfigModule {
  static register(appConfigOptions: AppConfigOptions): DynamicModule {
    const imports = [ConfigModule.forRoot({ validationSchema: configSchema(appConfigOptions) })];
    const providers = [AppConfig, ConfigService];

    return {
      module: EnvConfigModule,
      imports,
      providers,
      exports: providers,
    };
  }
}
