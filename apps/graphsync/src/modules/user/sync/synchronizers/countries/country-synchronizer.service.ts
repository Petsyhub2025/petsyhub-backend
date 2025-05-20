import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  Country,
  GraphCountryNode,
  ICountryModel,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class CountrySynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<Country>) {
    const country = await this.countryModel.findById(doc._id);

    const migrationProps = {
      props: {
        countries: [GraphCountryNode.from(country)],
      },
    };

    await this.neo4jService.query(GraphCountryNode.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH (o:${NodeTypesEnum.COUNTRY} {countryId: $id})
      DETACH DELETE o
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(CountrySynchronizerService.name, docId, deleteQuery);
  }
}
