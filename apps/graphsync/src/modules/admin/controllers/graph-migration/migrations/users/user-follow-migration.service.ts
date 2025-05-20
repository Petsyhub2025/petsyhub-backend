import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  UserFollow,
  CustomLoggerService,
  GraphUserFollowRelation,
  IUserFollowModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class UserFollowMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting UserFollow Model migration to Neo4j');

    await this.paginationService.paginateFind(this.userFollowModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<UserFollow>[]) {
    try {
      const migrationProps = {
        props: {
          userFollows: GraphUserFollowRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphUserFollowRelation.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.userFollows.length} UserFollow Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate UserFollow Model to Neo4j`, { error: e });
    }
  }
}
