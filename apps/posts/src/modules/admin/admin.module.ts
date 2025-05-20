import { Module } from '@nestjs/common';
import { SharedModule } from '@posts/shared-module/shared.module';
import { PostsController } from './controllers/posts/posts.controller';
import { PostsService } from './controllers/posts/posts.service';
import { FiltersController } from './controllers/filters/filters.controller';
import { FiltersService } from './controllers/filters/filters.service';

@Module({
  imports: [SharedModule],
  controllers: [PostsController, FiltersController],
  providers: [PostsService, FiltersService],
})
export class AdminModule {}
