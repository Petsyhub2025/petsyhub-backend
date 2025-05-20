import { errorManager } from '@engagement/user/shared/config/errors.config';
import { CommentIdParamDto } from '@engagement/user/shared/dto/comment-id-param.dto';
import { PostIdParamDto } from '@engagement/user/shared/dto/post-id-param.dto';
import {
  CommentEventsEnum,
  ICommentModel,
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
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { getCommentPipeLine } from '@engagement/user/shared/helpers/shared-pipeline.helper';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    private readonly userFollowHelper: UserFollowHelperService,
    private readonly petFollowHelper: PetFollowHelperService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createComment(userId: string, { postId }: PostIdParamDto, { body }: CreateCommentDto) {
    if (!(await this.postModel.exists({ _id: postId, isViewable: true }))) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }
    const comment = new this.commentModel({
      authorUser: new Types.ObjectId(userId),
      post: new Types.ObjectId(postId),
      body,
    });
    const savedComment = await comment.save();
    this.eventEmitter.emit(CommentEventsEnum.SEND_NOTIFICATION, savedComment);
    const [newComment] = await this.commentModel.aggregate([
      {
        $match: {
          _id: comment._id,
        },
      },
      ...getCommentPipeLine(userId, 0),
    ]);

    return newComment;
  }

  async updateComment(userId: string, { commentId }: CommentIdParamDto, { body }: UpdateCommentDto) {
    const comment = await this.commentModel.findOne({ _id: commentId, isViewable: true });
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }

    if (comment.authorUser.toString() !== userId) {
      throw new ForbiddenException(errorManager.USER_MISMATCH_ERROR);
    }

    comment.body = body;
    await comment.save();
    const [newComment] = await this.commentModel.aggregate([
      {
        $match: {
          _id: comment._id,
        },
      },
      ...getCommentPipeLine(userId, 0),
    ]);
    return newComment;
  }

  async deleteComment(userId: string, { commentId }: CommentIdParamDto) {
    const comment = await this.commentModel.findOne({ _id: commentId, isViewable: true });
    if (!comment) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }

    if (comment.authorUser.toString() !== userId) {
      throw new ForbiddenException(errorManager.USER_MISMATCH_ERROR);
    }

    await comment.deleteDoc();
  }

  async getComments(userId: string, { postId }: PostIdParamDto, { limit, afterId }: GetCommentsQueryDto) {
    const post = await this.postModel.findOne(
      { _id: postId, isViewable: true },
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

    const comments = await this.commentModel.aggregate([
      {
        $match: {
          post: new Types.ObjectId(postId),
          ...(afterId && { _id: { $lt: new Types.ObjectId(afterId) } }),
          isViewable: true,
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: limit,
      },
      ...getCommentPipeLine(userId),
    ]);
    return comments;
  }
}
