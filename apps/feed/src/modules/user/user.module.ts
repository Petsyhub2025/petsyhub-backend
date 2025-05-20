import { Module } from '@nestjs/common';
import { SharedModule } from '@feed/shared-module/shared.module';
import { FeedController } from './controllers/feed/feed.controller';
import { FeedService } from './controllers/feed/feed.service';
import { EnrichFeedService } from './shared/helpers/enrichment/enrich-feed.service';
import { EnrichPostsService } from './shared/helpers/enrichment/enrich-posts.service';
import { EnrichCommentReplyService } from './shared/helpers/enrichment/enrich-comment-reply.service';
import { EnrichCommentService } from './shared/helpers/enrichment/enrich-comment.service';

@Module({
  imports: [SharedModule],
  controllers: [FeedController],
  providers: [FeedService, EnrichFeedService, EnrichPostsService, EnrichCommentReplyService, EnrichCommentService],
})
export class UserModule {}
