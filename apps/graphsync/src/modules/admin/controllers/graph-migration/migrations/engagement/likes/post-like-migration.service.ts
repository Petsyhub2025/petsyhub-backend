import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  CustomLoggerService,
  GraphLikeRelation,
  IPostLikeModel,
  ModelNames,
  Neo4jService,
  PostLike,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export default class PostLikeMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.POST_LIKE) private postLikeModel: IPostLikeModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting Post Like Model migration to Neo4j');

    await this.paginationService.paginateFind(this.postLikeModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<PostLike>[]) {
    try {
      const migrationProps = {
        props: {
          likes: GraphLikeRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphLikeRelation.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.likes.length} Post Like Model documents to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate Post Like Model to Neo4j`, { error: e });
    }
  }
}
