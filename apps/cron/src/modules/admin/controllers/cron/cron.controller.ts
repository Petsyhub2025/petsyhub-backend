import { Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomLoggerService,
  CustomResponse,
} from '@instapets-backend/common';
import { CronService } from './cron.service';

@Controller({ path: 'cron', version: VERSION_NEUTRAL })
@ApiTags('admin/cron')
export class CronController {
  constructor(
    private readonly cronService: CronService,
    private logger: CustomLoggerService,
  ) {}

  @ApiBearerAuth()
  @Post()
  @AdminPermission({ resource: AdminResourcesEnum.SYNC, operation: AdminResourceOperationsEnum.UPDATE })
  async runCron() {
    this.cronService.runCron().catch((e) => {
      this.logger.error(e?.message, { error: e });
    });

    return new CustomResponse().success({
      localizedMessage: {
        en: 'Cron Job Started, check logs for results',
        ar: 'تم بدء مهمة الجدولة، تحقق من السجلات للحصول على النتائج',
      },
    });
  }
}
