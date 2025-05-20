import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '../common/base-relation.relation';
import { RelationTypesEnum } from '../common/relation-types.enum';
import { NodeTypesEnum } from '../../nodes/common/node-types.enum';
import { CommentReplyLike } from '@common/schemas/mongoose/engagement/like/comment-reply-like/comment-reply-like.type';

export class GraphCommentReplyLikeRelation extends GraphBaseRelation<GraphCommentReplyLikeRelation> {
  public likeId: string;
  public user: string;
  public post: string;

  public static from(like: HydratedDocument<CommentReplyLike>) {
    if (
      !like?.commentReply ||
      !like.commentReply?.['replyOn']?.['post'] ||
      !like._id ||
      !like.authorUser ||
      !like.createdAt
    )
      return null;

    const graphCommentReplyLikeRelation = new GraphCommentReplyLikeRelation({
      likeId: like._id.toString(),
      user: like.authorUser.toString(),
      userType: 'user',
      post: like.commentReply?.['replyOn']?.['post']?.toString(),
      type: 'PostCommentReplyLike',
      createdAt: like.createdAt.toISOString(),
      relationType: RelationTypesEnum.LIKED_A_COMMENT_REPLY_ON,
    });

    return graphCommentReplyLikeRelation;
  }

  public static fromArray(likes: HydratedDocument<CommentReplyLike>[]) {
    return likes.map((like) => GraphCommentReplyLikeRelation.from(like)).filter((like) => like);
  }

  public static get syncQuery() {
    const createQuery = `
      UNWIND $props.likes as like
      MATCH (n:${NodeTypesEnum.POST} {postId: like.post})
      MATCH (u:${NodeTypesEnum.USER} {userId: like.user})
      SET u.latestActivityDate = datetime(like.createdAt)
      MERGE (u)-[:${RelationTypesEnum.LIKED_A_COMMENT_REPLY_ON} {userType: like.userType, likeId: like.likeId, user: like.user, createdAt: datetime(like.createdAt), type: like.type, relationType: like.relationType}]->(n)
    `;

    return createQuery;
  }
}
