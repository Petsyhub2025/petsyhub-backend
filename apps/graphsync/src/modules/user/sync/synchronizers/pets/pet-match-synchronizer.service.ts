import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphRequestedPetMatchRelation,
  IPetMatchModel,
  ModelNames,
  Neo4jService,
  PetMatch,
  RelationTypesEnum,
} from '@instapets-backend/common';
import { MaintainUserInteractionsService } from '@graphsync/user/shared';

@Injectable()
export class PetMatchSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    private readonly maintainUserInteractionsService: MaintainUserInteractionsService,
    @Inject(ModelNames.PET_MATCH) private petMatchModel: IPetMatchModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<PetMatch>) {
    const petMatch = await this.petMatchModel.findById(doc._id);

    const migrationProps = {
      props: {
        petMatches: [GraphRequestedPetMatchRelation.from(petMatch)],
      },
    };

    await this.neo4jService.query(GraphRequestedPetMatchRelation.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.REQUESTED_MATCH} {petMatchId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(PetMatchSynchronizerService.name, docId, deleteQuery);
  }
}
