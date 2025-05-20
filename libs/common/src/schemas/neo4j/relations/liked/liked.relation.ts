import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '../common/base-relation.relation';
import { RelationTypesEnum } from '../common/relation-types.enum';
import { NodeTypesEnum } from '../../nodes/common/node-types.enum';
import { PostLike } from '@common/schemas/mongoose/engagement/like/post-like/post-like.type';

export class GraphLikeRelation extends GraphBaseRelation<GraphLikeRelation> {
  public likeId: string;
  public user: string;
  public post: string;

  public static from(like: HydratedDocument<PostLike>) {
    if (!like?.post || !like._id || !like.authorUser || !like.createdAt) return null;

    const graphLikeRelation = new GraphLikeRelation({
      likeId: like._id.toString(),
      user: like.authorUser.toString(),
      userType: 'user',
      post: like.post.toString(),
      type: 'PostLike',
      createdAt: like.createdAt.toISOString(),
      relationType: RelationTypesEnum.LIKED,
    });

    return graphLikeRelation;
  }

  public static fromArray(likes: HydratedDocument<PostLike>[]) {
    return likes.map((like) => GraphLikeRelation.from(like)).filter((like) => like);
  }

  public static get syncQuery() {
    const createQuery = `
      UNWIND $props.likes as like
      MATCH (n:${NodeTypesEnum.POST} {postId: like.post})
      MATCH (u:${NodeTypesEnum.USER} {userId: like.user})
      SET u.latestActivityDate = datetime(like.createdAt)
      WITH n, u, like
      OPTIONAL MATCH (pe:${NodeTypesEnum.PET} {petId: n.author})
      OPTIONAL MATCH (pt:${NodeTypesEnum.PET_TYPE} {typeId: pe.petType})
      MERGE (u)-[:${RelationTypesEnum.LIKED} {userType: like.userType, likeId: like.likeId, user: like.user, createdAt: datetime(like.createdAt), type: like.type, relationType: like.relationType}]->(n)
      FOREACH(unUsedValue IN CASE WHEN pt IS NOT NULL THEN [1] ELSE [] END |
        CREATE (u)-[iw:${RelationTypesEnum.INTERACTED_WITH} {interactionDate: datetime(like.createdAt), relationType: '${RelationTypesEnum.INTERACTED_WITH}'}]->(pt)
      )
    `;

    return createQuery;
  }
}
