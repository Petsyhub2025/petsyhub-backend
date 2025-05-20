import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  ModelNames,
  Neo4jService,
  RelationTypesEnum,
  IUserTopicModel,
  UserTopic,
  GraphUserHasInterestRelation,
} from '@instapets-backend/common';

@Injectable()
export class UserHasInterestSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.USER_TOPIC) private userTopicModel: IUserTopicModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<UserTopic>) {
    const userTopic = await this.userTopicModel.findById(doc._id);

    const migrationProps = {
      props: {
        userTopics: [GraphUserHasInterestRelation.from(userTopic)],
      },
    };

    await this.neo4jService.query(GraphUserHasInterestRelation.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.HAS_INTEREST} {userTopicId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(UserHasInterestSynchronizerService.name, docId, deleteQuery);
  }
}
