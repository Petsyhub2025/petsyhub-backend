import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  PetType,
  GraphPetTypeNode,
  IPetTypeModel,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class PetTypeSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<PetType>) {
    const petType = await this.petTypeModel.findById(doc._id);

    const migrationProps = {
      props: {
        petTypes: [GraphPetTypeNode.from(petType)],
      },
    };

    await this.neo4jService.query(GraphPetTypeNode.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH (o:${NodeTypesEnum.PET_TYPE} {typeId: $id})
      DETACH DELETE o
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(PetTypeSynchronizerService.name, docId, deleteQuery);
  }
}
