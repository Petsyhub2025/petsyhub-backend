import { ErrorType } from '@common/enums';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ElasticsearchService } from './elasticsearch.service';
import { CustomError } from '@common/classes/custom-error.class';

@Injectable()
export class ElasticSearchHealthService extends HealthIndicator {
  constructor(private readonly elasticSearchService: ElasticsearchService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = await this.elasticSearchService.client.ping();
    const result = this.getStatus('elasticsearch', isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new ServiceUnavailableException(
      new CustomError({
        event: 'ELASTICSEARCH_HEALTH_CHECK_ERROR',
        errorType: ErrorType.UNHEALTHY,
        error: new Error('ElasticSearch health check failed'),
        localizedMessage: {
          en: 'ElasticSearch health check failed',
          ar: 'فشل التحقق من صحة قاعدة البيانات',
        },
      }),
    );
  }
}
