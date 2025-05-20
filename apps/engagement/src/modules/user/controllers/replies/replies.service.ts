import { errorManager } from '@engagement/user/shared/config/errors.config';
import { CommentIdParamDto } from '@engagement/user/shared/dto/comment-id-param.dto';
import { ReplyIdParamDto } from '@engagement/user/shared/dto/reply-id-param.dto';
import { getRepliesPipeline } from '@engagement/user/shared/helpers/shared-pipeline.helper';
import {
  CommentReplyEventsEnum,
  ICommentModel,
  ICommentReplyModel,
  IPetModel,
  IPostModel,
  IUserModel,
  ModelNames,
  PetFollowHelperService,
  UserFollowHelperService,
} from '@instapets-backend/common';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { CreateReplyDto } from './dto/create-reply.dto';
import { GetRepliesQueryDto } from './dto/get-replies.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';

@Injectable()
export class RepliesService {
  constructor(
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    private readonly userFollowHelper: UserFollowHelperService,
    private readonly petFollowHelper: PetFollowHelperService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createReply(userId: string, { commentId }: CommentIdParamDto, { body }: CreateReplyDto) {
    const comment = await this.commentModel.findOne({ _id: commentId, isViewable: true }, { _id: 0, post: 1 });
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }

    const commentReply = new this.commentReplyModel({
      authorUser: new Types.ObjectId(userId),
      replyOn: new Types.ObjectId(commentId),
      post: comment.post,
      body,
    });
    const savedCommentReply = await commentReply.save();
    this.eventEmitter.emit(CommentReplyEventsEnum.SEND_NOTIFICATION, savedCommentReply);
    const [newCommentReply] = await this.commentReplyModel.aggregate([
      {
        $match: {
          _id: commentReply._id,
        },
      },
      ...getRepliesPipeline(userId),
    ]);
    return newCommentReply;
  }

  async updateReply(userId: string, { replyId }: ReplyIdParamDto, { body }: UpdateReplyDto) {
    const commentReply = await this.commentReplyModel.findOne({ _id: replyId, isViewable: true });
    if (!commentReply) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }

    if (commentReply.authorUser.toString() !== userId) {
      throw new ForbiddenException(errorManager.USER_MISMATCH_ERROR);
    }

    commentReply.body = body;
    await commentReply.save();
    const [newCommentReply] = await this.commentReplyModel.aggregate([
      {
        $match: {
          _id: commentReply._id,
        },
      },
      ...getRepliesPipeline(userId),
    ]);
    return newCommentReply;
  }

  async deleteReply(userId: string, { replyId }: ReplyIdParamDto) {
    const commentReply = await this.commentReplyModel.findOne({ _id: replyId, isViewable: true });
    if (!commentReply) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }

    if (commentReply.authorUser.toString() !== userId) {
      throw new ForbiddenException(errorManager.USER_MISMATCH_ERROR);
    }

    await commentReply.deleteDoc();
  }

  async getReplies(userId: string, { commentId }: CommentIdParamDto, { limit, afterId }: GetRepliesQueryDto) {
    const comment = await this.commentModel.findOne({ _id: commentId, isViewable: true }, { _id: 0, post: 1 });
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }

    const post = await this.postModel.findOne(
      { _id: comment._id, isViewable: true },
      {
        _id: 0,
        authorPet: 1,
        authorUser: 1,
        hasAllowedUsers: 1,
        allowedUsers: 1,
        isPrivate: 1,
        authorPetOwnedByUser: 1,
      },
    );

    if (!post) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    const [viewedPet, viewedUser] = await Promise.all([
      this.petModel.findById(post.authorPet),
      this.userModel.findById(post.authorUser),
    ]);

    const isPetOwnedByUser = post.authorPet && post.authorPetOwnedByUser.toString() === userId;
    const isPostOwnedByUser = post.authorUser && post.authorUser.toString() === userId;

    if (
      (post.isPrivate && !isPetOwnedByUser && !isPostOwnedByUser) ||
      (post.hasAllowedUsers && !post.allowedUsers.some((user) => user.toString() === userId)) ||
      (viewedUser && !isPostOwnedByUser && !(await this.userFollowHelper.canUserViewUserContent(viewedUser, userId))) ||
      (viewedPet && !isPetOwnedByUser && !(await this.petFollowHelper.canUserViewPetContent(viewedPet, userId)))
    ) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    const commentReplies = await this.commentReplyModel.aggregate([
      {
        $match: {
          replyOn: commentId,
          ...(afterId && { _id: { $lt: afterId } }),
          isViewable: true,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $limit: limit,
      },
      ...getRepliesPipeline(userId),
    ]);

    return commentReplies;
  }
}
