import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  Post,
  CustomLoggerService,
  GraphPostNode,
  IPostModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class PostMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.POST) private postModel: IPostModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting Post Model migration to Neo4j');

    await this.paginationService.paginateFind(this.postModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<Post>[]) {
    try {
      const migrationProps = {
        props: {
          posts: GraphPostNode.fromArray(docs),
        },
      };

      // Migrate posts nodes
      await this.neo4jService.query(GraphPostNode.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.posts.length} Post Model documents to Neo4j`);

      // Migrate HAS_TOPIC relations
      await this.neo4jService.query(GraphPostNode.syncHasTopicRelationQuery, migrationProps);
      this.logger.log(`Successfully migrated HAS_TOPIC relation to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate Post Model to Neo4j`, { error: e });
    }
  }
}
