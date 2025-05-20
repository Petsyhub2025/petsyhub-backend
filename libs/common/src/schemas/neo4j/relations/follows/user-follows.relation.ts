import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '@common/schemas/neo4j/relations/common/base-relation.relation';
import { RelationTypesEnum } from '@common/schemas/neo4j/relations/common/relation-types.enum';
import { NodeTypesEnum } from '@common/schemas/neo4j/nodes/common/node-types.enum';
import { UserFollow } from '@common/schemas/mongoose/user/user-follow/user-follow.type';

export class GraphUserFollowRelation extends GraphBaseRelation<GraphUserFollowRelation> {
  public followId: string;
  public follower: string;
  public following: string;

  public static from(follow: HydratedDocument<UserFollow>) {
    if (!follow._id || !follow.follower || !follow.following || !follow.createdAt) return null;

    const userFollowRelation = new GraphUserFollowRelation({
      followId: follow._id.toString(),
      follower: follow.follower.toString(),
      following: follow.following.toString(),
      createdAt: follow.createdAt.toISOString(),
      relationType: RelationTypesEnum.FOLLOWS,
      type: 'UserFollow',
    });

    return userFollowRelation;
  }

  public static fromArray(follows: HydratedDocument<UserFollow>[]) {
    return follows.map((follow) => GraphUserFollowRelation.from(follow)).filter((follow) => follow);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.userFollows as userFollow
      MATCH (follower:${NodeTypesEnum.USER} {userId: userFollow.follower}),
            (following:${NodeTypesEnum.USER} {userId: userFollow.following})
      MERGE (follower)-[:${RelationTypesEnum.FOLLOWS} {followId: userFollow.followId, type: userFollow.type, follower: userFollow.follower, following: userFollow.following, createdAt: datetime(userFollow.createdAt), relationType: userFollow.relationType}]->(following)
    `;
  }
}
