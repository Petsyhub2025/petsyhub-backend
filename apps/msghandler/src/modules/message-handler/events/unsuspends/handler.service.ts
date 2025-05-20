import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { DEFAULT_RPC_TIMEOUT } from '@msghandler/shared/constants';
import { RedisManager, RedisService } from '@songkeys/nestjs-redis';
import {
  ICommentModel,
  ICommentReplyModel,
  IGraphSyncMigrateRpcPayload,
  IPetModel,
  IPostModel,
  IUnsuspendEvent,
  IUserModel,
  ListenerError,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { Redis } from 'ioredis';

@Injectable()
export class UnSuspendsHandlerService {
  private readonly redis: Redis;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
  ) {
    this.redis = this.redisService.getClient();
  }

  async unSuspendUser({ _id }: IUnsuspendEvent) {
    const user = await this.assertUserMigration(_id);

    await user._unSuspendDoc();
    await this.redis.srem(RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_USER, _id);
  }

  async unSuspendPost({ _id }: IUnsuspendEvent) {
    const post = await this.assertPostMigration(_id);

    await post._unSuspendDoc();
    await this.redis.srem(RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_POST, _id);
  }

  async unSuspendComment({ _id }: IUnsuspendEvent) {
    const comment = await this.assertCommentMigration(_id);

    await comment._unSuspendDoc();
    await this.redis.srem(RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_COMMENT, _id);
  }

  private async assertUserMigration(_id: string) {
    if (!_id) {
      throw new ListenerError({
        message: '_id is required in unsuspend user event',
      });
    }

    const user = await this.userModel.findById(_id);

    if (!user) {
      throw new ListenerError({
        message: `User with _id ${_id} not found`,
      });
    }

    const payload: IGraphSyncMigrateRpcPayload = {
      model: ModelNames.USER,
      _id: user._id.toString(),
    };

    await this.amqpConnection.request({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.GRAPH_SYNC_RPC_MIGRATE_MODEL,
      payload,
      timeout: DEFAULT_RPC_TIMEOUT,
    });

    return user;
  }

  private async assertPostMigration(_id: string) {
    if (!_id) {
      throw new ListenerError({
        message: '_id is required in unsuspend post event',
      });
    }

    const post = await this.postModel.findById(_id);

    if (!post) {
      throw new ListenerError({
        message: `Post with _id ${_id} not found`,
      });
    }

    const payload: IGraphSyncMigrateRpcPayload = {
      model: ModelNames.POST,
      _id: post._id.toString(),
    };

    await this.amqpConnection.request({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.GRAPH_SYNC_RPC_MIGRATE_MODEL,
      payload,
      timeout: DEFAULT_RPC_TIMEOUT,
    });

    return post;
  }

  private async assertCommentMigration(_id: string) {
    if (!_id) {
      throw new ListenerError({
        message: '_id is required in unsuspend comment event',
      });
    }

    const comment = await this.commentModel.findById(_id);

    if (!comment) {
      throw new ListenerError({
        message: `Comment with _id ${_id} not found`,
      });
    }

    const payload: IGraphSyncMigrateRpcPayload = {
      model: ModelNames.COMMENT,
      _id: comment._id.toString(),
    };

    await this.amqpConnection.request({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.GRAPH_SYNC_RPC_MIGRATE_MODEL,
      payload,
      timeout: DEFAULT_RPC_TIMEOUT,
    });

    return comment;
  }
}
