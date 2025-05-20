import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Provider } from '@nestjs/common';
import { ELASTICSEARCH_CLIENT, ELASTICSEARCH_MODULE_OPTIONS } from '../constants';
import {
  ElasticsearchModuleAsyncOptions,
  ElasticsearchModuleOptions,
} from '../interfaces/elasticsearch-module-options.interface';

export const createAsyncOptionsProvider = (options: ElasticsearchModuleAsyncOptions): Provider => ({
  provide: ELASTICSEARCH_MODULE_OPTIONS,
  useFactory: options.useFactory,
  inject: options.inject ?? [],
});

export const elasticsearchClientProvider: Provider<ElasticsearchClient> = {
  provide: ELASTICSEARCH_CLIENT,
  useFactory: ({ connectionString }: ElasticsearchModuleOptions): ElasticsearchClient =>
    new ElasticsearchClient({ node: connectionString }),
  inject: [ELASTICSEARCH_MODULE_OPTIONS],
};
