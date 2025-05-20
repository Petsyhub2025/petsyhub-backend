import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  PetMatch,
  CustomLoggerService,
  GraphRequestedPetMatchRelation,
  IPetMatchModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class PetMatchMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.PET_MATCH) private petMatchModel: IPetMatchModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting PetMatch Model migration to Neo4j');

    await this.paginationService.paginateFind(this.petMatchModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<PetMatch>[]) {
    try {
      const migrationProps = {
        props: {
          petMatches: GraphRequestedPetMatchRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphRequestedPetMatchRelation.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.petMatches.length} PetMatch Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate PetMatch Model to Neo4j`, { error: e });
    }
  }
}
