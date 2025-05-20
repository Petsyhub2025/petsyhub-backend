import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports/reports.controller';
import { ReportsService } from './controllers/reports/reports.service';
import { SharedModule } from '@moderation/shared-module/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class AdminModule {}
