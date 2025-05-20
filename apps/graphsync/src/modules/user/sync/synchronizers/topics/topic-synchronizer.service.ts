import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import { GraphTopicNode, ITopicModel, ModelNames, Neo4jService, NodeTypesEnum, Topic } from '@instapets-backend/common';

@Injectable()
export class TopicSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.TOPIC) private topicModel: ITopicModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<Topic>) {
    const topic = await this.topicModel.findById(doc._id);

    const migrationProps = {
      props: {
        topics: [GraphTopicNode.from(topic)],
      },
    };

    await this.neo4jService.query(GraphTopicNode.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH (o:${NodeTypesEnum.TOPIC} {topicId: $id})
      DETACH DELETE o
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(TopicSynchronizerService.name, docId, deleteQuery);
  }
}
