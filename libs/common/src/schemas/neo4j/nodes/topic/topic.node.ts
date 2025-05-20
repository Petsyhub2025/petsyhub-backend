import { HydratedDocument } from 'mongoose';
import { GraphBaseNode } from '@common/schemas/neo4j/nodes/common';
import { NodeTypesEnum } from '@common/schemas/neo4j/nodes/common';
import { Topic } from '@common/schemas/mongoose/topic';

export class GraphTopicNode extends GraphBaseNode<GraphTopicNode> {
  public topicId: string;

  public static from(topic: HydratedDocument<Topic>) {
    if (!topic._id) return null;

    const graphTopicNode = new GraphTopicNode({
      topicId: topic._id.toString(),
      type: NodeTypesEnum.TOPIC,
      createdAt: topic.createdAt.toISOString(),
    });

    return graphTopicNode;
  }

  public static fromArray(topics: HydratedDocument<Topic>[]) {
    return topics.map((topic) => GraphTopicNode.from(topic)).filter((topic) => topic);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.topics as topic
      MERGE (t:${NodeTypesEnum.TOPIC} {topicId: topic.topicId})
      ON CREATE
        SET t.type = topic.type,
            t.createdAt = topic.createdAt
    `;
  }
}
