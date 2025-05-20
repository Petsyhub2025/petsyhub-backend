import { ErrorType } from '@common/enums';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Neo4jService } from './neo4j.service';
import { CustomError } from '@common/classes/custom-error.class';

@Injectable()
export class Neo4jHealthService extends HealthIndicator {
  constructor(private readonly neo4jService: Neo4jService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = await this.neo4jService.ping();
    const result = this.getStatus('neo4j', isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new ServiceUnavailableException(
      new CustomError({
        event: 'NEO4J_HEALTH_CHECK_ERROR',
        errorType: ErrorType.UNHEALTHY,
        error: new Error('Neo4j health check failed'),
        localizedMessage: {
          en: 'Neo4j health check failed',
          ar: 'فشل التحقق من صحة قاعدة البيانات',
        },
      }),
    );
  }
}
