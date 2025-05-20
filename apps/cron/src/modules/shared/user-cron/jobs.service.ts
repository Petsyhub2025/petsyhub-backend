import { Injectable } from '@nestjs/common';
import * as nodeCron from 'node-cron';
import { UsersFastRPService } from './jobs/fastrp/users/users-fastrp.service';
import { UsersKNNService } from './jobs/knn/users/users-knn.service';
import { AsyncWrapperService } from '@cron/shared-module/services/async-wrapper.service';
import { PostsDegreeService } from './jobs/degree/posts/posts-degree.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly asyncWrapperService: AsyncWrapperService,
    private readonly usersFastRPService: UsersFastRPService,
    private readonly usersKNNService: UsersKNNService,
    private readonly postsDegreeService: PostsDegreeService,
  ) {
    this.initCronJobs();
  }

  private async initCronJobs() {
    // Every 6 hours
    nodeCron.schedule('0 */6 * * *', async () => {
      await this.asyncWrapperService.asyncWrapper(async () => {
        await this.usersFastRPService.runUsersFastRP();
        await this.usersKNNService.runUsersKNN();
      });
    });

    // Every 3 hours
    nodeCron.schedule('0 */3 * * *', async () => {
      await this.asyncWrapperService.asyncWrapper(async () => {
        await this.postsDegreeService.runPostsDegree();
      });
    });
  }

  async runOnDemandCron() {
    await this.asyncWrapperService.asyncWrapper(async () => {
      await this.usersFastRPService.runUsersFastRP();
      await this.usersKNNService.runUsersKNN();
    });

    await this.asyncWrapperService.asyncWrapper(async () => {
      await this.postsDegreeService.runPostsDegree();
    });
  }
}
