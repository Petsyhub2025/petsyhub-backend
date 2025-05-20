import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  User,
  CustomLoggerService,
  GraphUserNode,
  IUserModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class UserMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting User Model migration to Neo4j');

    await this.paginationService.paginateFind(this.userModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<User>[]) {
    try {
      const migrationProps = {
        props: {
          users: GraphUserNode.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphUserNode.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.users.length} User Model documents to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate User Model to Neo4j`, { error: e });
    }
  }
}
