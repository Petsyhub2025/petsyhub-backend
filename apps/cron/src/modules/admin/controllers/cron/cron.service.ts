import { Injectable } from '@nestjs/common';
import { JobsService } from '@cron/shared-module/user-cron/jobs.service';

@Injectable()
export class CronService {
  constructor(private readonly jobsService: JobsService) {}

  async runCron() {
    await this.jobsService.runOnDemandCron();
  }
}
