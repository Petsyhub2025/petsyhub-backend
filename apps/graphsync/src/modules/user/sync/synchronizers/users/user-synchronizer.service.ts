import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import { User, GraphUserNode, IUserModel, ModelNames, Neo4jService, NodeTypesEnum } from '@instapets-backend/common';

@Injectable()
export class UserSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<User>) {
    const user = await this.userModel.findById(doc._id);

    if (!user.isViewable) {
      await this.deleteFromNeo4j(user._id.toString());

      return;
    }

    const migrationProps = {
      props: {
        users: [GraphUserNode.from(user)],
      },
    };

    await this.neo4jService.query(GraphUserNode.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH (o:${NodeTypesEnum.USER} {userId: $id})
      DETACH DELETE o
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(UserSynchronizerService.name, docId, deleteQuery);
  }
}
