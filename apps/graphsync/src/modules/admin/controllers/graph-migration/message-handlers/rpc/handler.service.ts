import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import PostLikeMigrationService from '@graphsync/graph-migration/migrations/engagement/likes/post-like-migration.service';
import { Inject, Injectable } from '@nestjs/common';
import {
  Comment,
  CommentLike,
  CommentReply,
  CommentReplyLike,
  CustomLoggerService,
  IGraphSyncMigrateRpcPayload,
  IPostModel,
  IUserModel,
  ModelNames,
  Pet,
  PetFollow,
  Post,
  PostLike,
  RpcError,
  RpcResponse,
  User,
  UserFollow,
  UserTopic,
} from '@instapets-backend/common';
import {
  CommentLikeMigrationService,
  CommentMigrationService,
  CommentReplyLikeMigrationService,
  CommentReplyMigrationService,
  PetFollowMigrationService,
  PetMigrationService,
  PostMigrationService,
  UserFollowMigrationService,
  UserMigrationService,
} from '@graphsync/admin/controllers/graph-migration/migrations';
import { UserHasInterestMigrationService } from '@graphsync/graph-migration/migrations/users/user-has-interest-migration.service';

@Injectable()
export class RpcHandlerService {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly amqpConnection: AmqpConnection,
    private readonly petMigrationService: PetMigrationService,
    private readonly postMigrationService: PostMigrationService,
    private readonly userMigrationService: UserMigrationService,
    private readonly petFollowMigrationService: PetFollowMigrationService,
    private readonly userFollowMigrationService: UserFollowMigrationService,
    private readonly userHasInterestMigrationService: UserHasInterestMigrationService,
    private readonly commentLikeMigrationService: CommentLikeMigrationService,
    private readonly postLikeMigrationService: PostLikeMigrationService,
    private readonly commentMigrationService: CommentMigrationService,
    private readonly commentReplyLikeMigrationService: CommentReplyLikeMigrationService,
    private readonly commentReplyMigrationService: CommentReplyMigrationService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.COMMENT) private commentModel: IPostModel,
  ) {}

  async migrateModel({ _id, model }: IGraphSyncMigrateRpcPayload): Promise<RpcResponse> {
    if (!model || !_id) {
      throw new RpcError({
        message: 'Model is required',
      });
    }

    this.logger.log(`Received migration request for ${model} with id ${_id}`);

    switch (model) {
      case ModelNames.USER:
        await this.migrateUser(_id);
        break;
      case ModelNames.POST:
        await this.migratePost(_id);
        break;
      case ModelNames.COMMENT:
        await this.migrateComment(_id);
        break;
      default:
        throw new RpcError({
          message: 'Incompatible migration request',
        });
    }

    return RpcResponse.success();
  }

  private async migrateUser(_id: string) {
    const user = await this.userModel.findOne({ _id, isViewable: true });

    if (!user) {
      throw new RpcError({
        message: 'User not found',
      });
    }

    await this.userMigrationService.migrate<Hydrate<User>>({ _id: user._id, isViewable: true });
    await this.petMigrationService.migrate<Pet>({ user: user._id, isViewable: true });
    await this.postMigrationService.migrate<Post>({
      $or: [
        {
          authorUser: user._id,
        },
        {
          authorPetOwnedByUser: user._id,
        },
      ],
      isViewable: true,
    });
    await this.petFollowMigrationService.migrate<PetFollow>({ follower: user._id, isViewable: true });
    await this.userFollowMigrationService.migrate<UserFollow>({
      $or: [
        {
          follower: user._id,
        },
        {
          following: user._id,
        },
      ],
      isViewable: true,
    });
    await this.userHasInterestMigrationService.migrate<UserTopic>({
      user: user._id,
      isViewable: true,
    });
    await this.commentLikeMigrationService.migrate<CommentLike>({ $match: { authorUser: user._id, isViewable: true } });
    await this.commentReplyLikeMigrationService.migrate<CommentReplyLike>({
      $match: { authorUser: user._id, isViewable: true },
    });
    await this.postLikeMigrationService.migrate<PostLike>({ authorUser: user._id, isViewable: true });
    await this.commentMigrationService.migrate<Comment>({ authorUser: user._id, isViewable: true });
    await this.commentReplyMigrationService.migrate<CommentReply>({
      $match: { authorUser: user._id, isViewable: true },
    });
  }

  private async migratePost(_id: string) {
    const post = await this.postModel.findOne({ _id, isViewable: true });

    if (!post) {
      throw new RpcError({
        message: 'Post not found',
      });
    }

    await this.postMigrationService.migrate<Post>({ _id: post._id, isViewable: true });
    await this.postLikeMigrationService.migrate<PostLike>({ post: post._id, isViewable: true });
    await this.commentMigrationService.migrate<Comment>({ post: post._id, isViewable: true });
    await this.commentLikeMigrationService.migrate<CommentLike>({ $match: { post: post._id, isViewable: true } });
    await this.commentReplyMigrationService.migrate<CommentReply>({ $match: { post: post._id, isViewable: true } });
    await this.commentReplyLikeMigrationService.migrate<CommentReplyLike>({
      $match: { post: post._id, isViewable: true },
    });
  }

  private async migrateComment(_id: string) {
    const comment = await this.commentModel.findOne({ _id, isViewable: true });

    if (!comment) {
      throw new RpcError({
        message: 'Comment not found',
      });
    }

    await this.commentMigrationService.migrate<Comment>({ _id: comment._id, isViewable: true });
    await this.commentLikeMigrationService.migrate<CommentLike>({ $match: { comment: comment._id, isViewable: true } });
    await this.commentReplyMigrationService.migrate<CommentReply>({
      $match: { comment: comment._id, isViewable: true },
    });
    await this.commentReplyLikeMigrationService.migrate<CommentReplyLike>({
      $match: { comment: comment._id, isViewable: true },
    });
  }
}
