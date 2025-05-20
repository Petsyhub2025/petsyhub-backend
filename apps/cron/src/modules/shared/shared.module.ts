import { Module } from '@nestjs/common';
import { JobsService } from '@cron/shared-module/user-cron/jobs.service';
import { AsyncWrapperService } from './services/async-wrapper.service';
import { ProjectionService } from './services/projection.service';
import { UsersKNNService } from './user-cron/jobs/knn/users/users-knn.service';
import { UsersFastRPService } from './user-cron/jobs/fastrp/users/users-fastrp.service';
import { PostsDegreeService } from './user-cron/jobs/degree/posts/posts-degree.service';

const imports = [];
const providers = [
  JobsService,
  AsyncWrapperService,
  ProjectionService,
  UsersKNNService,
  UsersFastRPService,
  PostsDegreeService,
];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
