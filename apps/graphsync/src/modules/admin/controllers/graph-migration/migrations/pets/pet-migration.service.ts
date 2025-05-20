import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import { Pet, CustomLoggerService, GraphPetNode, IPetModel, ModelNames, Neo4jService } from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class PetMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting Pet Model migration to Neo4j');

    await this.paginationService.paginateFind(this.petModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<Pet>[]) {
    try {
      const migrationProps = {
        props: {
          pets: GraphPetNode.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphPetNode.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.pets.length} Pet Model documents to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate Pet Model to Neo4j`, { error: e });
    }
  }
}
