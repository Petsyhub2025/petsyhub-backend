import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Inject, Injectable } from '@nestjs/common';
import { ELASTICSEARCH_CLIENT } from '../constants';

@Injectable()
export class ElasticsearchService {
  constructor(
    @Inject(ELASTICSEARCH_CLIENT)
    private readonly elasticsearchClient: ElasticsearchClient,
  ) {}

  get client(): ElasticsearchClient {
    return this.elasticsearchClient;
  }
}
