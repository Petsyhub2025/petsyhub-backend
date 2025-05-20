import { Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomLoggerService,
  CustomResponse,
} from '@instapets-backend/common';
import { GraphMigrationService } from './graph-migration.service';

@Controller({ path: 'graph', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class GraphMigrationController {
  constructor(
    private readonly graphMigrationService: GraphMigrationService,
    private readonly logger: CustomLoggerService,
  ) {}

  @ApiBearerAuth()
  @Post('/migrate')
  @AdminPermission({ resource: AdminResourcesEnum.SYNC, operation: AdminResourceOperationsEnum.UPDATE })
  async migrate() {
    this.graphMigrationService.migrate().catch((e) => this.logger.error(e?.message || e, { error: e }));

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
  @AdminPermission({ resource: AdminResourcesEnum.SYNC, operation: AdminResourceOperationsEnum.UPDATE })
  async resetAndMigrate() {
    this.graphMigrationService.resetAndMigrate().catch((e) => this.logger.error(e?.message || e, { error: e }));

    return new CustomResponse().success({
      localizedMessage: {
        en: 'Graph reset & migration started, check logs for progress',
        ar: 'تم بدء الترحيل، يرجى التحقق من السجلات للحصول على التقدم',
      },
      event: 'MIGRATION_STARTED',
    });
  }
}
