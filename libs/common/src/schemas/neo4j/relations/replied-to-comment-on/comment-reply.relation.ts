import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '../common/base-relation.relation';
import { RelationTypesEnum } from '../common/relation-types.enum';
import { NodeTypesEnum } from '../../nodes/common/node-types.enum';
import { CommentReply } from '@common/schemas/mongoose/engagement/comment-reply/comment-reply.type';

export class GraphCommentReplyRelation extends GraphBaseRelation<GraphCommentReplyRelation> {
  public commentReplyId: string;
  public user: string;
  public post: string;

  public static from(commentReply: HydratedDocument<CommentReply>) {
    if (
      !commentReply?.replyOn ||
      !commentReply?.replyOn?.['post'] ||
      !commentReply._id ||
      !commentReply.authorUser ||
      !commentReply.createdAt
    )
      return null;

    const graphCommentReplyRelation = new GraphCommentReplyRelation({
      commentReplyId: commentReply._id.toString(),
      user: commentReply.authorUser.toString(),
      userType: 'user',
      post: commentReply?.replyOn?.['post']?.toString(),
      type: 'PostCommentReply',
      createdAt: commentReply.createdAt.toISOString(),
      relationType: RelationTypesEnum.REPLIED_TO_COMMENT_ON,
    });

    return graphCommentReplyRelation;
  }

  public static fromArray(commentReplies: HydratedDocument<CommentReply>[]) {
    return commentReplies
      .map((commentReply) => GraphCommentReplyRelation.from(commentReply))
      .filter((commentReply) => commentReply);
  }

  public static get syncQuery() {
    const createQuery = `
      UNWIND $props.commentReplies as commentReply
      MATCH (n:${NodeTypesEnum.POST} {postId: commentReply.post})
      MATCH (u:${NodeTypesEnum.USER} {userId: commentReply.user})
      SET u.latestActivityDate = datetime(commentReply.createdAt)
      MERGE (u)-[:${RelationTypesEnum.REPLIED_TO_COMMENT_ON} {userType: commentReply.userType, commentReplyId: commentReply.commentReplyId, user: commentReply.user, createdAt: datetime(commentReply.createdAt), type: commentReply.type, relationType: commentReply.relationType}]->(n)
    `;

    return createQuery;
  }
}
