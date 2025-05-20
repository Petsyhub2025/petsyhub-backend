import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  PetType,
  CustomLoggerService,
  GraphPetTypeNode,
  IPetTypeModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class PetTypeMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting PetType Model migration to Neo4j');

    await this.paginationService.paginateFind(this.petTypeModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<PetType>[]) {
    try {
      const migrationProps = {
        props: {
          petTypes: GraphPetTypeNode.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphPetTypeNode.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.petTypes.length} PetType Model documents to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate PetType Model to Neo4j`, { error: e });
    }
  }
}
