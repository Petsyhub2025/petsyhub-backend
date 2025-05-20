import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '@common/schemas/neo4j/relations/common/base-relation.relation';
import { RelationTypesEnum } from '@common/schemas/neo4j/relations/common/relation-types.enum';
import { NodeTypesEnum } from '@common/schemas/neo4j/nodes/common/node-types.enum';
import { UserTopic } from '@common/schemas/mongoose/user/user-topic';

export class GraphUserHasInterestRelation extends GraphBaseRelation<GraphUserHasInterestRelation> {
  public userTopicId: string;
  public userId: string;
  public topicId: string;

  public static from(userTopic: HydratedDocument<UserTopic>) {
    if (!userTopic._id || !userTopic.topic || !userTopic.user) return null;

    const graphUserHasInterestRelation = new GraphUserHasInterestRelation({
      userTopicId: userTopic._id.toString(),
      userId: userTopic.user.toString(),
      topicId: userTopic.topic.toString(),
      relationType: RelationTypesEnum.HAS_INTEREST,
      type: 'HasInterest',
      createdAt: userTopic.createdAt.toISOString(),
    });

    return graphUserHasInterestRelation;
  }

  public static fromArray(userTopics: HydratedDocument<UserTopic>[]) {
    return userTopics.map((userTopic) => GraphUserHasInterestRelation.from(userTopic)).filter((userTopic) => userTopic);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.userTopics AS userTopic
      MATCH (u:${NodeTypesEnum.USER} {userId: userTopic.userId}), (t:${NodeTypesEnum.TOPIC} {topicId: userTopic.topicId})
      MERGE (u)-[r:${RelationTypesEnum.HAS_INTEREST} {userTopicId : userTopic.userTopicId, relationType: userTopic.relationType, createdAt: datetime(userTopic.createdAt), userId: userTopic.userId, topicId: userTopic.topicId}]->(t)
    `;
  }
}
