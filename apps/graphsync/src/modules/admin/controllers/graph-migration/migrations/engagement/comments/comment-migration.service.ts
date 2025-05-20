import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  Comment,
  CustomLoggerService,
  GraphCommentRelation,
  ICommentModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class CommentMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting Comment Model migration to Neo4j');

    await this.paginationService.paginateFind(
      this.commentModel,
      {
        ...query,
      },
      async (docs) => {
        await this.syncToNeo4j(docs);
      },
    );
  }

  async syncToNeo4j(docs: Hydrate<Comment>[]) {
    try {
      const migrationProps = {
        props: {
          comments: GraphCommentRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphCommentRelation.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.comments.length} Comment Model documents to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate Comment Model to Neo4j`, { error: e });
    }
  }
}
