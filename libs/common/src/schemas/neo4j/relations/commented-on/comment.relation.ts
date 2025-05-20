import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '../common/base-relation.relation';
import { RelationTypesEnum } from '../common/relation-types.enum';
import { NodeTypesEnum } from '../../nodes/common/node-types.enum';
import { Comment } from '@common/schemas/mongoose/engagement/comment/comment.type';

export class GraphCommentRelation extends GraphBaseRelation<GraphCommentRelation> {
  public commentId: string;
  public user: string;
  public post: string;

  public static from(comment: HydratedDocument<Comment>) {
    if (!comment?.post || !comment._id || !comment.authorUser || !comment.createdAt) return null;

    const graphCommentRelation = new GraphCommentRelation({
      commentId: comment._id.toString(),
      user: comment.authorUser.toString(),
      userType: 'user',
      post: comment.post.toString(),
      type: 'PostComment',
      createdAt: comment.createdAt.toISOString(),
      relationType: RelationTypesEnum.COMMENTED_ON,
    });

    return graphCommentRelation;
  }

  public static fromArray(comments: HydratedDocument<Comment>[]) {
    return comments.map((comment) => GraphCommentRelation.from(comment)).filter((comment) => comment);
  }

  public static get syncQuery() {
    const createQuery = `
      UNWIND $props.comments as comment
      MATCH (n:${NodeTypesEnum.POST} {postId: comment.post})
      MATCH (u:${NodeTypesEnum.USER} {userId: comment.user})
      SET u.latestActivityDate = datetime(comment.createdAt)
      MERGE (u)-[:${RelationTypesEnum.COMMENTED_ON} {userType: comment.userType, commentId: comment.commentId, user: comment.user, createdAt: datetime(comment.createdAt), type: comment.type, relationType: comment.relationType}]->(n)
    `;

    return createQuery;
  }
}
