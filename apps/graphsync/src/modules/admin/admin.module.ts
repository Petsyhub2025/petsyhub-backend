import { Module } from '@nestjs/common';
import { SharedModule } from '@graphsync/shared-module/shared.module';
import {
  CityMigrationService,
  CountryMigrationService,
  PetMigrationService,
  PostMigrationService,
  UserMigrationService,
  PetFollowMigrationService,
  UserFollowMigrationService,
  CommentLikeMigrationService,
  CommentMigrationService,
  CommentReplyLikeMigrationService,
  CommentReplyMigrationService,
  PetTypeMigrationService,
  PetMatchMigrationService,
} from './controllers/graph-migration/migrations';
import { GraphMigrationController } from './controllers/graph-migration/graph-migration.controller';
import { GraphMigrationService } from './controllers/graph-migration/graph-migration.service';
import { RpcHandlerService } from './controllers/graph-migration/message-handlers/rpc/handler.service';
import { RpcReceiverService } from './controllers/graph-migration/message-handlers/rpc/receiver.service';
import PostLikeMigrationService from '@graphsync/graph-migration/migrations/engagement/likes/post-like-migration.service';
import { TopicMigrationService } from '@graphsync/graph-migration/migrations/topics';
import { UserHasInterestMigrationService } from '@graphsync/graph-migration/migrations/users/user-has-interest-migration.service';

@Module({
  imports: [SharedModule],
  controllers: [GraphMigrationController],
  providers: [
    GraphMigrationService,
    CityMigrationService,
    CountryMigrationService,
    TopicMigrationService,
    PetMigrationService,
    PostMigrationService,
    UserMigrationService,
    PetFollowMigrationService,
    UserFollowMigrationService,
    UserHasInterestMigrationService,
    CommentLikeMigrationService,
    PostLikeMigrationService,
    CommentMigrationService,
    CommentReplyLikeMigrationService,
    CommentReplyMigrationService,
    PetTypeMigrationService,
    PetMatchMigrationService,
    RpcHandlerService,
    RpcReceiverService,
  ],
})
export class AdminModule {}
