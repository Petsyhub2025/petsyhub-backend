import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '../common/base-relation.relation';
import { RelationTypesEnum } from '../common/relation-types.enum';
import { NodeTypesEnum } from '../../nodes/common/node-types.enum';
import { CommentLike } from '@common/schemas/mongoose/engagement/like/comment-like/comment-like.type';

export class GraphCommentLikeRelation extends GraphBaseRelation<GraphCommentLikeRelation> {
  public likeId: string;
  public user: string;
  public post: string;

  public static from(like: HydratedDocument<CommentLike>) {
    if (!like?.comment || !like?.comment?.['post'] || !like._id || !like.authorUser || !like.createdAt) return null;

    const graphCommentLikeRelation = new GraphCommentLikeRelation({
      likeId: like._id.toString(),
      user: like.authorUser.toString(),
      userType: 'user',
      post: like.comment?.['post']?.toString(),
      type: 'PostCommentLike',
      createdAt: like.createdAt.toISOString(),
      relationType: RelationTypesEnum.LIKED_A_COMMENT_ON,
    });

    return graphCommentLikeRelation;
  }

  public static fromArray(likes: HydratedDocument<CommentLike>[]) {
    return likes.map((like) => GraphCommentLikeRelation.from(like)).filter((like) => like);
  }

  public static get syncQuery() {
    const createQuery = `
      UNWIND $props.likes as like
      MATCH (n:${NodeTypesEnum.POST} {postId: like.post})
      MATCH (u:${NodeTypesEnum.USER} {userId: like.user})
      SET u.latestActivityDate = datetime(like.createdAt)
      MERGE (u)-[:${RelationTypesEnum.LIKED_A_COMMENT_ON} {userType: like.userType, likeId: like.likeId, user: like.user, createdAt: datetime(like.createdAt), type: like.type, relationType: like.relationType}]->(n)
    `;

    return createQuery;
  }
}
