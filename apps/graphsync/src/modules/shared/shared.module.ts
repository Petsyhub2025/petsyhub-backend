import { Module } from '@nestjs/common';
import {
  CityMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  CountryMongooseModule,
  LikeMongooseModule,
  PetFollowMongooseModule,
  PetMatchMongooseModule,
  PetMongooseModule,
  PetTypeMongooseModule,
  PostMongooseModule,
  TopicMongooseModule,
  UserFollowMongooseModule,
  UserMongooseModule,
  UserTopicMongooseModule,
} from '@instapets-backend/common';
import { Neo4jDeleteHandler } from './utils/neo4j-delete-handler.service';
import { PaginationService } from './utils/pagination.service';
import { ResumeTokenService } from './utils/resume-token.service';

const imports = [
  CityMongooseModule,
  CountryMongooseModule,
  PostMongooseModule,
  UserMongooseModule,
  PetMongooseModule,
  UserFollowMongooseModule,
  PetFollowMongooseModule,
  LikeMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  PetTypeMongooseModule,
  PetMatchMongooseModule,
  TopicMongooseModule,
  UserTopicMongooseModule,
];
const providers = [PaginationService, Neo4jDeleteHandler, ResumeTokenService];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
