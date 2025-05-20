import { errorManager } from '@engagement/user/shared/config/errors.config';
import { ObjectIdParamDto } from '@engagement/user/shared/dto/object-id-param.dto';
import {
  CommentLikeEventsEnum,
  CommentReplyLikeEventsEnum,
  ICommentLikeModel,
  ICommentModel,
  ICommentReplyLikeModel,
  ICommentReplyModel,
  IPetModel,
  IPostLikeModel,
  IPostModel,
  IUserModel,
  LikeType,
  ModelNames,
  PetFollowHelperService,
  PostLikeEventsEnum,
  UserFollowHelperService,
} from '@instapets-backend/common';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HydratedDocument, Model, PipelineStage, Types } from 'mongoose';
import { GetLikersQueryDto } from './dto/get-likers.dto';
import { LikeObjectQueryDto } from './dto/like-object.dto';
import { UnLikeObjectQueryDto } from './dto/unlike-object.dto';
import { getLikersPipeline } from './helpers/like-pipeline.helper';

@Injectable()
export class LikesService {
  constructor(
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
    @Inject(ModelNames.COMMENT_LIKE) private commentLikeModel: ICommentLikeModel,
    @Inject(ModelNames.COMMENT_REPLY_LIKE) private commentReplyLikeModel: ICommentReplyLikeModel,
    @Inject(ModelNames.POST_LIKE) private postLikeModel: IPostLikeModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    private readonly userFollowHelper: UserFollowHelperService,
    private readonly petFollowHelper: PetFollowHelperService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async likeObject(userId: string, { objectId }: ObjectIdParamDto, { likeType }: LikeObjectQueryDto) {
    await this.checkObjectExists(objectId, likeType, userId);

    //as each type has its own signature, we need to cast it to the base type
    const likeModel = this[`${likeType}LikeModel`] as Model<any>;

    if (await likeModel.exists({ authorUser: userId, [likeType]: objectId })) {
      throw new ConflictException(errorManager.LIKE_ALREADY_EXISTS);
    }

    const payload = {
      authorUser: new Types.ObjectId(userId),
      [likeType]: new Types.ObjectId(objectId),
    };
    const like = new likeModel(payload);
    const savedLike = await like.save();
    this.emitLikeNotification(savedLike, likeType);
  }

  async unLikeObject(userId: string, { objectId }: ObjectIdParamDto, { likeType }: UnLikeObjectQueryDto) {
    await this.checkObjectExists(objectId, likeType, userId);

    const likeModel = this[`${likeType}LikeModel`] as Model<any>;

    const like = await likeModel.findOne({ authorUser: userId, [likeType]: objectId });

    if (!like) {
      throw new NotFoundException(errorManager.LIKE_ALREADY_EXISTS);
    }
    await like.deleteDoc();
  }

  async getLikers(userId: string, { objectId }: ObjectIdParamDto, { page, limit, likeType }: GetLikersQueryDto) {
    await this.checkObjectExists(objectId, likeType, userId);

    const likeModel = this[`${likeType}LikeModel`] as Model<any>;

    const matchStage: PipelineStage[] = [
      {
        $match: {
          [likeType]: new Types.ObjectId(objectId),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      likeModel.aggregate(matchStage).count('total'),
      likeModel.aggregate([
        ...matchStage,
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
        ...getLikersPipeline(userId),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async emitLikeNotification(like: HydratedDocument<any>, likeType: string) {
    if (likeType === LikeType.COMMENT) {
      this.eventEmitter.emit(CommentLikeEventsEnum.SEND_NOTIFICATION, like);
    }
    if (likeType === LikeType.COMMENT_REPLY) {
      this.eventEmitter.emit(CommentReplyLikeEventsEnum.SEND_NOTIFICATION, like);
    }
    if (likeType === LikeType.POST) {
      this.eventEmitter.emit(PostLikeEventsEnum.SEND_NOTIFICATION, like);
    }
  }

  //TODO: add check as a static for each model
  private async checkObjectExists(objectId: string, likeType: string, userId: string) {
    if (likeType === LikeType.COMMENT && !(await this.commentModel.exists({ _id: objectId }))) {
      throw new NotFoundException(errorManager.COMMENT_NOT_FOUND);
    }
    if (likeType === LikeType.COMMENT_REPLY && !(await this.commentReplyModel.exists({ _id: objectId }))) {
      throw new NotFoundException(errorManager.COMMENT_REPLY_NOT_FOUND);
    }
    if (likeType === LikeType.POST) {
      const post = await this.postModel.findOne(
        { _id: objectId, isViewable: true },
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
        (viewedUser &&
          !isPostOwnedByUser &&
          !(await this.userFollowHelper.canUserViewUserContent(viewedUser, userId))) ||
        (viewedPet && !isPetOwnedByUser && !(await this.petFollowHelper.canUserViewPetContent(viewedPet, userId)))
      ) {
        throw new NotFoundException(errorManager.POST_NOT_FOUND);
      }
    }
  }
}
