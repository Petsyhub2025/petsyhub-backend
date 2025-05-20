import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  Topic,
  CustomLoggerService,
  GraphTopicNode,
  ITopicModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class TopicMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.TOPIC) private topicModel: ITopicModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting Topic Model migration to Neo4j');

    await this.paginationService.paginateFind(this.topicModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<Topic>[]) {
    try {
      const migrationProps = {
        props: {
          topics: GraphTopicNode.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphTopicNode.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.topics.length} Topic Model documents to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate Topic Model to Neo4j`, { error: e });
    }
  }
}
