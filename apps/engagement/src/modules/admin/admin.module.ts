import { Module } from '@nestjs/common';
import { CommentsController } from './controllers/comments/comments.controller';
import { RepliesController } from './controllers/replies/replies.controller';
import { RepliesService } from './controllers/replies/replies.service';
import { CommentsService } from './controllers/comments/comments.service';
import { SharedModule } from '@engagement/shared-module/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CommentsController, RepliesController],
  providers: [RepliesService, CommentsService],
})
export class AdminModule {}
