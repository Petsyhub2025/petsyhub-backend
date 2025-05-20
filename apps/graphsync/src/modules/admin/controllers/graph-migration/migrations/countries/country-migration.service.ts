import { IMigrationService } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  Country,
  CustomLoggerService,
  GraphCountryNode,
  ICountryModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class CountryMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
  ) {}

  async migrate<T = any>(query?: FilterQuery<T>) {
    this.logger.log('Starting Country Model migration to Neo4j');

    await this.paginationService.paginateFind(this.countryModel, query, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<Country>[]) {
    try {
      const migrationProps = {
        props: {
          countries: GraphCountryNode.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphCountryNode.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.countries.length} Country Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate Country Model to Neo4j`, { error: e });
    }
  }
}
