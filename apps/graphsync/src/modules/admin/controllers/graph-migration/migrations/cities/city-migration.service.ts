import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  City,
  CustomLoggerService,
  GraphCityNode,
  ICityModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class CityMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting City Model migration to Neo4j');

    await this.paginationService.paginateFind(
      this.cityModel,
      {
        ...query,
      },
      async (docs) => {
        await this.syncToNeo4j(docs);
      },
    );
  }

  async syncToNeo4j(docs: Hydrate<City>[]) {
    try {
      const migrationProps = {
        props: {
          cities: GraphCityNode.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphCityNode.syncQuery, migrationProps);
      this.logger.log(`Successfully migrated ${migrationProps.props.cities.length} City Model documents to Neo4j`);
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate City Model to Neo4j`, { error: e });
    }
  }
}
