import { Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomLoggerService,
  CustomResponse,
  NoApiVersion,
} from '@instapets-backend/common';
import { ElasticSearchMigrationService } from './elastic-search-migration.service';

@Controller({ path: 'elastic-search-migration', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class ElasticSearchMigrationController {
  constructor(
    private readonly elasticSearchMigrationService: ElasticSearchMigrationService,
    private readonly logger: CustomLoggerService,
  ) {}

  @ApiBearerAuth()
  @Post('/migrate')
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.SYNC, operation: AdminResourceOperationsEnum.UPDATE })
  async migrate() {
    this.elasticSearchMigrationService.migrate().catch((e) => this.logger.error(e?.message || e, { error: e }));

    return new CustomResponse().success({
      localizedMessage: {
        en: 'Migration started, check logs for progress',
        ar: 'تم بدء الترحيل، يرجى التحقق من السجلات للحصول على التقدم',
      },
      event: 'MIGRATION_STARTED',
    });
  }

  @ApiBearerAuth()
  @Post('/reset')
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.SYNC, operation: AdminResourceOperationsEnum.UPDATE })
  async resetAndMigrate() {
    this.elasticSearchMigrationService.resetAndMigrate().catch((e) => this.logger.error(e?.message || e, { error: e }));

    return new CustomResponse().success({
      localizedMessage: {
        en: 'Elastic reset & migration started, check logs for progress',
        ar: 'تم بدء إعادة تعيين Elastic والترحيل، يرجى التحقق من السجلات للحصول على التقدم',
      },
      event: 'MIGRATION_STARTED',
    });
  }
}
