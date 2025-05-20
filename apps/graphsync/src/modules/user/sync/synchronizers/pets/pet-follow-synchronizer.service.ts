import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphPetFollowRelation,
  IPetFollowModel,
  ModelNames,
  Neo4jService,
  PetFollow,
  RelationTypesEnum,
} from '@instapets-backend/common';
import { MaintainUserInteractionsService } from '@graphsync/user/shared';

@Injectable()
export class PetFollowSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    private readonly maintainUserInteractionsService: MaintainUserInteractionsService,
    @Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<PetFollow>) {
    const petFollow = await this.petFollowModel.findById(doc._id);

    const migrationProps = {
      props: {
        petFollows: [GraphPetFollowRelation.from(petFollow)],
      },
    };

    await this.neo4jService.query(GraphPetFollowRelation.syncQuery, migrationProps);
    await this.maintainUserInteractionsService.maintainUserInteractions(petFollow.follower.toString());
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.FOLLOWS} {followId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(PetFollowSynchronizerService.name, docId, deleteQuery);
  }
}
