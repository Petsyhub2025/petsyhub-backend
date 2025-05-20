import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Connection } from 'mongoose';

@Injectable()
export class MongoDbHealthService extends HealthIndicator {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = this.connection.readyState === 1;
    const result = this.getStatus('mongodb', isHealthy, { readyState: this.connection.readyState });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Mongodb Health failed', result);
  }
}
