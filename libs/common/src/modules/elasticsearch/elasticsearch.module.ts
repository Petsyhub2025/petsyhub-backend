import { DynamicModule, Module } from '@nestjs/common';
import { ElasticsearchModuleAsyncOptions } from './interfaces';
import { createAsyncOptionsProvider, elasticsearchClientProvider } from './providers';
import { ElasticSearchHealthService, ElasticsearchService } from './services';

@Module({})
export class ElasticsearchModule {
  static registerAsync(options: ElasticsearchModuleAsyncOptions, isGlobal = true): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for ElasticsearchModule: useFactory is required');

    const providers = [
      createAsyncOptionsProvider(options),
      elasticsearchClientProvider,
      ElasticsearchService,
      ElasticSearchHealthService,
    ];

    const imports = [];

    return {
      module: ElasticsearchModule,
      imports,
      providers,
      exports: [...imports, ...providers],
      global: isGlobal,
    };
  }
}
