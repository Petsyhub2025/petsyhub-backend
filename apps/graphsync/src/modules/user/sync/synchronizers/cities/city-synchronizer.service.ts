import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import { City, GraphCityNode, ICityModel, ModelNames, Neo4jService, NodeTypesEnum } from '@instapets-backend/common';

@Injectable()
export class CitySynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<City>) {
    const city = await this.cityModel.findById(doc._id);

    const migrationProps = {
      props: {
        cities: [GraphCityNode.from(city)],
      },
    };

    await this.neo4jService.query(GraphCityNode.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH (o:${NodeTypesEnum.CITY} {cityId: $id})
      DETACH DELETE o
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(CitySynchronizerService.name, docId, deleteQuery);
  }
}
