import { Inject, Injectable } from '@nestjs/common';
import {
  Comment,
  CommentReply,
  GraphAction,
  GraphCommentLikeRelation,
  GraphCommentRelation,
  GraphCommentReplyLikeRelation,
  GraphCommentReplyRelation,
  ICommentLikeModel,
  ICommentReplyLikeModel,
  IPetModel,
  IPostLikeModel,
  IUserFollowModel,
  ModelNames,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';
import { EnrichCommentReplyService } from './enrich-comment-reply.service';
import { EnrichCommentService } from './enrich-comment.service';

@Injectable()
export class EnrichPostsService {
  constructor(
    private readonly commentParserService: EnrichCommentService,
    private readonly commentReplyParserService: EnrichCommentReplyService,
    @Inject(ModelNames.COMMENT_LIKE) private commentLikeModel: ICommentLikeModel,
    @Inject(ModelNames.COMMENT_REPLY_LIKE) private commentReplyLikeModel: ICommentReplyLikeModel,
  ) {}

  async getEnrichedPostCommentContent(action: GraphAction, viewerId: string) {
    const { commentId: comment } = action.data as GraphCommentRelation;

    const enrichedContent = (await this.commentParserService.parseComment(
      comment,
      viewerId,
    )) as HydratedDocument<Comment>;

    return enrichedContent;
  }

  async getEnrichedPostCommentLikeContent(action: GraphAction, viewerId: string) {
    const { likeId: like } = action.data as GraphCommentLikeRelation;

    const likedComment = await this.commentLikeModel.findById(like).lean();
    const enrichedContent = (await this.commentParserService.parseComment(
      likedComment?.comment.toString(),
      viewerId,
    )) as HydratedDocument<Comment>;

    return enrichedContent;
  }

  async getEnrichedPostCommentReplyContent(action: GraphAction, viewerId: string) {
    const { commentReplyId: commentReply } = action.data as GraphCommentReplyRelation;

    const enrichedContent = (await this.commentReplyParserService.parseCommentReply(
      commentReply,
      viewerId,
    )) as HydratedDocument<CommentReply>;

    return enrichedContent;
  }

  async getEnrichedPostCommentReplyLikeContent(action: GraphAction, viewerId: string) {
    const { likeId: like } = action.data as GraphCommentReplyLikeRelation;

    const likedCommentReply = await this.commentReplyLikeModel.findById(like).lean();

    const enrichedContent = (await this.commentReplyParserService.parseCommentReply(
      likedCommentReply?.commentReply.toString(),
      viewerId,
    )) as HydratedDocument<CommentReply>;

    return enrichedContent;
  }
}
