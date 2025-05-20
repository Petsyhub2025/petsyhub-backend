import { Module } from '@nestjs/common';
import { SharedModule } from '@moderation/shared-module/shared.module';
import { ReportsController } from './controllers/reports/reports.controller';
import { ReportsService } from './controllers/reports/reports.service';

@Module({
  imports: [SharedModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class UserModule {}
