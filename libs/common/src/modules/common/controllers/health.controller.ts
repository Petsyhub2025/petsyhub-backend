import { ErrorType } from '@common/enums';
import { Controller, Get, Inject, ServiceUnavailableException, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { HEALTH_CHECK_FUNCTIONS, MEMORY_CONFIG } from '../constants/common.constant';
import { MemoryConfig } from '../interfaces';
import { HealthChecksConfig } from '../interfaces/health-checks-config.interface';
import { CustomError } from '@common/classes/custom-error.class';
import { CustomResponse } from '@common/classes/custom-response.class';
import { IsPrivateAuthOrPublic, NoApiVersion } from '@common/decorators/metadata';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { MongoDbHealthService } from '../services/health-checks';

@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
@ApiTags('health-check')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private mongodbHealth: MongoDbHealthService,
    private appConfig: AppConfig,
    @Inject(MEMORY_CONFIG) private memoryConfig: MemoryConfig,
    @Inject(HEALTH_CHECK_FUNCTIONS) private healthChecks: HealthChecksConfig,
  ) {}

  @IsPrivateAuthOrPublic()
  @NoApiVersion()
  @HealthCheck()
  @Get()
  async healthCheck(): Promise<CustomResponse> {
    const healthResults = await this.health.check([
      () =>
        this.memory.checkHeap('memory_heap', 0.9 * this.memoryConfig.maxHeapSizeInBytes).catch((error) => {
          throw new ServiceUnavailableException(
            new CustomError({
              event: 'MEMORY_HEAP_CHECK_ERROR',
              errorType: ErrorType.UNHEALTHY,
              error: error,
              localizedMessage: {
                en: 'Memory heap exceeded threshold',
                ar: 'تم تجاوز الحد الأعلى لحجم الذاكرة',
              },
            }),
          );
        }),
      () =>
        this.mongodbHealth.isHealthy().catch((error) => {
          throw new ServiceUnavailableException(
            new CustomError({
              event: 'MONGODB_HEALTH_CHECK_ERROR',
              errorType: ErrorType.UNHEALTHY,
              error: error,
              localizedMessage: {
                en: 'Mongodb health check failed',
                ar: 'فشل التحقق من صحة قاعدة البيانات',
              },
            }),
          );
        }),
      ...Object.values(this.healthChecks ?? {}),
    ]);

    return new CustomResponse().success({
      payload: {
        data: {
          ...healthResults,
          appName: `instapets-${this.appConfig.NODE_ENV}-backend-${this.appConfig.APP_SHORT_NAME}`,
          env: this.appConfig.NODE_ENV,
          uptime: this.appConfig.UPTIME,
        },
      },
      event: 'HEALTH_CHECK_SUCCESS',
      localizedMessage: {
        en: 'Health check success',
        ar: 'تم التحقق من صحة الخدمة',
      },
      statusCode: 200,
    });
  }
}
