import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import { GraphPetNode, IPetModel, ModelNames, Neo4jService, NodeTypesEnum, Pet } from '@instapets-backend/common';
import { MaintainUserInteractionsService } from '@graphsync/user/shared';

@Injectable()
export class PetSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    private readonly maintainUserInteractionsService: MaintainUserInteractionsService,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<Pet>) {
    const pet = await this.petModel.findById(doc._id);

    if (!pet.isViewable) {
      await this.deleteFromNeo4j(pet._id.toString());

      return;
    }

    const migrationProps = {
      props: {
        pets: [GraphPetNode.from(pet)],
      },
    };

    await this.neo4jService.query(GraphPetNode.syncQuery, migrationProps);
    await this.maintainUserInteractionsService.maintainUserInteractions(pet.user.userId.toString());
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH (o:${NodeTypesEnum.PET} {petId: $id})
      DETACH DELETE o
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(PetSynchronizerService.name, docId, deleteQuery);
  }
}
