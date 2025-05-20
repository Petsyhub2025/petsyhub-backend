import { EnvironmentEnum } from '@common/enums';
import { ModuleMetadata } from '@nestjs/common';
export interface FCMModuleOptions {
  firebaseEnv?: EnvironmentEnum;
}

export interface FCMModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<FCMModuleOptions> | FCMModuleOptions;
  inject?: any[];
}
