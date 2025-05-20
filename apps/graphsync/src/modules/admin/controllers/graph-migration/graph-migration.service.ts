import { Injectable } from '@nestjs/common';
import { CustomLoggerService, Neo4jService, NodeTypesEnum, RelationTypesEnum } from '@instapets-backend/common';
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
} from './migrations';
import PostLikeMigrationService from './migrations/engagement/likes/post-like-migration.service';
import { TopicMigrationService } from './migrations/topics';
import { UserHasInterestMigrationService } from './migrations/users/user-has-interest-migration.service';

@Injectable()
export class GraphMigrationService {
  private resetScript_1 = `
      MATCH ()-[r]->() 
      CALL { WITH r 
      DELETE r 
      } IN TRANSACTIONS OF 50000 ROWS;
    `;

  private resetScript_2 = `
      MATCH (n) 
      CALL { WITH n 
      DETACH DELETE n 
      } IN TRANSACTIONS OF 50000 ROWS;
    `;

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly logger: CustomLoggerService,
    private readonly cityMigrationService: CityMigrationService,
    private readonly countryMigrationService: CountryMigrationService,
    private readonly topicMigrationService: TopicMigrationService,
    private readonly petMigrationService: PetMigrationService,
    private readonly postMigrationService: PostMigrationService,
    private readonly userMigrationService: UserMigrationService,
    private readonly petFollowMigrationService: PetFollowMigrationService,
    private readonly userFollowMigrationService: UserFollowMigrationService,
    private readonly userHasInterestMigrationService: UserHasInterestMigrationService,
    private readonly commentLikeMigrationService: CommentLikeMigrationService,
    private readonly postLikeMigrationService: PostLikeMigrationService,
    private readonly commentMigrationService: CommentMigrationService,
    private readonly commentReplyLikeMigrationService: CommentReplyLikeMigrationService,
    private readonly commentReplyMigrationService: CommentReplyMigrationService,
    private readonly petTypeMigrationService: PetTypeMigrationService,
    private readonly petMatchMigrationService: PetMatchMigrationService,
  ) {}

  async migrate() {
    this.logger.log('Deleting all nodes and relationships...');
    await this.neo4jService.query(this.resetScript_1);
    await this.neo4jService.query(this.resetScript_2);

    // Migrate all nodes and relations
    await this.migrateAllData();
  }

  async resetAndMigrate() {
    const dropIndicesScript = `
      CALL apoc.schema.assert({},{},true) YIELD label, key
      RETURN *
    `;

    this.logger.log('Deleting all nodes and relationships...');
    await this.neo4jService.query(this.resetScript_1);
    await this.neo4jService.query(this.resetScript_2);

    this.logger.log('Dropping all indexes...');
    await this.neo4jService.query(dropIndicesScript);

    this.logger.log('Creating node constraints/indexes...');

    // Nodes
    await this.neo4jService.query(`CREATE CONSTRAINT userId FOR (a:${NodeTypesEnum.USER}) REQUIRE a.userId IS UNIQUE`);
    await this.neo4jService.query(`CREATE CONSTRAINT petId FOR (b:${NodeTypesEnum.PET}) REQUIRE b.petId IS UNIQUE`);
    await this.neo4jService.query(`CREATE CONSTRAINT postId FOR (c:${NodeTypesEnum.POST}) REQUIRE c.postId IS UNIQUE`);
    await this.neo4jService.query(
      `CREATE CONSTRAINT typeId FOR (c:${NodeTypesEnum.PET_TYPE}) REQUIRE c.typeId IS UNIQUE`,
    );
    await this.neo4jService.query(
      `CREATE CONSTRAINT countryId FOR (d:${NodeTypesEnum.COUNTRY}) REQUIRE d.countryId IS UNIQUE`,
    );
    await this.neo4jService.query(`CREATE CONSTRAINT cityId FOR (d:${NodeTypesEnum.CITY}) REQUIRE d.cityId IS UNIQUE`);
    await this.neo4jService.query(
      `CREATE INDEX profile_contentId_viewerId FOR (x:${NodeTypesEnum.PROFILE_FEED}) ON (x.contentId_viewerId)`,
      {},
    );
    await this.neo4jService.query(`CREATE INDEX feedId FOR (y:${NodeTypesEnum.FEED}) ON (y.feedId)`);
    await this.neo4jService.query(`CREATE INDEX feedOrder FOR (y:${NodeTypesEnum.FEED}) ON (y.feedOrder)`);
    await this.neo4jService.query(`CREATE INDEX profile_feedId FOR (z:${NodeTypesEnum.PROFILE_FEED}) ON (z.feedId)`);
    await this.neo4jService.query(`CREATE INDEX communityId FOR (n:${NodeTypesEnum.USER}) ON (n.communityId)`);
    await this.neo4jService.query(`CREATE INDEX userDegree FOR (n:${NodeTypesEnum.USER}) ON (n.userDegreeScore)`);
    await this.neo4jService.query(`CREATE INDEX postImages FOR (n:${NodeTypesEnum.POST}) ON (n.hasImages)`);
    await this.neo4jService.query(`CREATE INDEX postPagerank FOR (n:${NodeTypesEnum.POST}) ON (n.score)`);
    await this.neo4jService.query(`CREATE INDEX postDegree FOR (n:${NodeTypesEnum.POST}) ON (n.postDegreeScore)`);
    await this.neo4jService.query(`CREATE INDEX postCreatedAt FOR (n:${NodeTypesEnum.POST}) ON (n.createdAt)`);
    await this.neo4jService.query(`CREATE INDEX isPrivate_user FOR (n:${NodeTypesEnum.USER}) ON (n.isPrivate)`);
    await this.neo4jService.query(`CREATE INDEX isPrivate_pet FOR (n:${NodeTypesEnum.PET}) ON (n.isPrivate)`);
    await this.neo4jService.query(`CREATE INDEX userId_pet FOR (n:${NodeTypesEnum.PET}) ON (n.userId)`);
    await this.neo4jService.query(
      `CREATE INDEX latestActivityDate FOR (n:${NodeTypesEnum.USER}) ON (n.latestActivityDate)`,
    );
    await this.neo4jService.query(`CREATE INDEX isPrivate_post FOR (n:${NodeTypesEnum.POST}) ON (n.isPrivate)`);
    await this.neo4jService.query(
      `CREATE INDEX hasAllowedUsers_post FOR (n:${NodeTypesEnum.POST}) ON (n.hasAllowedUsers)`,
    );

    this.logger.log('Creating relationship indexes...');

    // Relationships
    await this.neo4jService.query(
      `CREATE INDEX commentId FOR ()-[h:${RelationTypesEnum.COMMENTED_ON}]->() ON (h.commentId)`,
    );
    await this.neo4jService.query(`CREATE INDEX liked_date FOR ()-[i:${RelationTypesEnum.LIKED}]->() ON (i.createdAt)`);
    await this.neo4jService.query(
      `CREATE INDEX likedACommentReplyDate FOR ()-[j:${RelationTypesEnum.LIKED_A_COMMENT_REPLY_ON}]->() ON (j.createdAt)`,
      {},
    );
    await this.neo4jService.query(
      `CREATE INDEX repliedToCommentDate FOR ()-[l:${RelationTypesEnum.REPLIED_TO_COMMENT_ON}]->() ON (l.createdAt)`,
      {},
    );
    await this.neo4jService.query(
      `CREATE INDEX postedDate FOR ()-[n:${RelationTypesEnum.POSTED}]->() ON (n.createdAt)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX likedACommentDate FOR ()-[q:${RelationTypesEnum.LIKED_A_COMMENT_ON}]->() ON (q.createdAt)`,
      {},
    );
    await this.neo4jService.query(
      `CREATE INDEX followsDate FOR ()-[r:${RelationTypesEnum.FOLLOWS}]->() ON (r.createdAt)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX followingId FOR ()-[s:${RelationTypesEnum.FOLLOWS}]->() ON (s.following)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX followerId FOR ()-[t:${RelationTypesEnum.FOLLOWS}]->() ON (t.follower)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX commentedOnDate FOR ()-[u:${RelationTypesEnum.COMMENTED_ON}]->() ON (u.createdAt)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX userSimilarity FOR ()-[k:${RelationTypesEnum.USER_SIMILAR}]->() ON (k.similarity)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX interactionDate FOR ()-[k:${RelationTypesEnum.INTERACTED_WITH}]->() ON (k.interactionDate)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX explorePost_order FOR ()-[k:${RelationTypesEnum.EXPLORE_POST}]->() ON (k.order)`,
    );
    await this.neo4jService.query(
      `CREATE INDEX petMatchId FOR ()-[k:${RelationTypesEnum.REQUESTED_MATCH}]->() ON (k.petMatchId)`,
    );

    for (const relationType of Object.values(RelationTypesEnum)) {
      await this.neo4jService.query(
        `CREATE INDEX ${relationType}_relationType FOR ()-[r:${relationType}]->() ON (r.relationType)`,
      );
    }

    await this.migrateAllData();
  }

  private async migrateAllData() {
    // Because SCREW mongoose and their query mutations to query on discriminators
    const getDefaultQuery = () => ({ isViewable: true });

    // Migrate nodes
    await this.topicMigrationService.migrate(getDefaultQuery());
    await this.countryMigrationService.migrate(getDefaultQuery());
    await this.cityMigrationService.migrate(getDefaultQuery());
    await this.userMigrationService.migrate(getDefaultQuery());
    await this.petTypeMigrationService.migrate(getDefaultQuery());
    await this.petMigrationService.migrate(getDefaultQuery());
    await this.postMigrationService.migrate(getDefaultQuery());

    // Migrate relationships

    // Likes
    await this.postLikeMigrationService.migrate(getDefaultQuery());
    await this.commentLikeMigrationService.migrate({ $match: getDefaultQuery() });
    await this.commentReplyLikeMigrationService.migrate({ $match: getDefaultQuery() });

    // Comments
    await this.commentMigrationService.migrate(getDefaultQuery());

    // Comment replies
    await this.commentReplyMigrationService.migrate({ $match: getDefaultQuery() });

    // Follows
    await this.userFollowMigrationService.migrate(getDefaultQuery());
    await this.petFollowMigrationService.migrate(getDefaultQuery());

    // Has Interest
    await this.userHasInterestMigrationService.migrate(getDefaultQuery());

    // Pet matches
    await this.petMatchMigrationService.migrate(getDefaultQuery());
  }
}
