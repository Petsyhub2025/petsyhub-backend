import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  PetFollow,
  CustomLoggerService,
  GraphPetFollowRelation,
  IPetFollowModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class PetFollowMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting PetFollow Model migration to Neo4j');

    await this.paginationService.paginateFind(this.petFollowModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<PetFollow>[]) {
    try {
      const migrationProps = {
        props: {
          petFollows: GraphPetFollowRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphPetFollowRelation.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.petFollows.length} PetFollow Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate PetFollow Model to Neo4j`, { error: e });
    }
  }
}
