import { Module } from '@nestjs/common';
import { SharedModule } from '@cron/shared-module/shared.module';
import { CronController } from './controllers/cron/cron.controller';
import { CronService } from './controllers/cron/cron.service';

@Module({
  imports: [SharedModule],
  controllers: [CronController],
  providers: [CronService],
})
export class AdminModule {}
