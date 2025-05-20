import { ModuleMetadata } from '@nestjs/common';
export interface StripeModuleOptions {
  secretKey: string;
}

export interface StripeModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<StripeModuleOptions> | StripeModuleOptions;
  inject?: any[];
}
