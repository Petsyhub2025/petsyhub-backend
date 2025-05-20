import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  CustomLoggerService,
  GraphUserHasInterestRelation,
  IUserTopicModel,
  ModelNames,
  Neo4jService,
  UserTopic,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class UserHasInterestMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.USER_TOPIC) private userTopicModel: IUserTopicModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting UserTopic Model migration to Neo4j');

    await this.paginationService.paginateFind(this.userTopicModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<UserTopic>[]) {
    try {
      const migrationProps = {
        props: {
          userTopics: GraphUserHasInterestRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphUserHasInterestRelation.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.userTopics.length} userTopic Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate userTopic Model to Neo4j`, { error: e });
    }
  }
}
