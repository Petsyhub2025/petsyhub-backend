import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphUserFollowRelation,
  IUserFollowModel,
  ModelNames,
  Neo4jService,
  UserFollow,
  RelationTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class UserFollowSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<UserFollow>) {
    const userFollow = await this.userFollowModel.findById(doc._id);

    const migrationProps = {
      props: {
        userFollows: [GraphUserFollowRelation.from(userFollow)],
      },
    };

    await this.neo4jService.query(GraphUserFollowRelation.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.FOLLOWS} {followId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(UserFollowSynchronizerService.name, docId, deleteQuery);
  }
}
