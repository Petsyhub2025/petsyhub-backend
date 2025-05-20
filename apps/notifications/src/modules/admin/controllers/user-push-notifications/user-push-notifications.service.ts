import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import {
  AppConfig,
  AwsSchedulerService,
  BasePaginationQuery,
  IDynamicLinkModel,
  ISearchResponseData,
  IUserPushNotificationModel,
  IUserSegmentModel,
  MediaTypeEnum,
  MediaUploadService,
  ResponsePayload,
  RpcResponse,
  UserPushNotification,
  UserPushNotificationAdminRpcPayload,
  UserPushNotificationStatusEnum,
  addMaintainOrderStages,
} from '@instapets-backend/common';
import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { UserPushNotificationIdParamDto, errorManager } from '@notifications/admin/shared';
import { Connection, PipelineStage, Types } from 'mongoose';
import { getUserPushNotificationAggregationPipeline } from './aggregations/get-user-push-notification.aggregation';
import { CancelUserPushNotificationDto } from './dto/cancel-user-push-notification.dto';
import { CreateUserPushNotificationDto } from './dto/create-push-notification.dto';
import { UpdateUserPushNotificationDto } from './dto/update-push-notification.dto';
import { GetUserPushNotificationsQueryDto } from './dto/get-user-push-notifications.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getUserPushNotificationsAggregationPipeline } from './aggregations/get-user-push-notifications.aggregation';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';

@Injectable()
export class UserPushNotificationsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(ModelNames.USER_SEGMENT) private userSegmentModel: IUserSegmentModel,
    @Inject(ModelNames.USER_PUSH_NOTIFICATION) private userPushNotificationModel: IUserPushNotificationModel,
    @Inject(ModelNames.DYNAMIC_LINK) private dynamicLinkModel: IDynamicLinkModel,
    private readonly awsSchedulerService: AwsSchedulerService,
    private readonly appConfig: AppConfig,
    private readonly amqpConnection: AmqpConnection,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async getUserPushNotifications(
    adminId: string,
    query: GetUserPushNotificationsQueryDto,
  ): Promise<ResponsePayload<UserPushNotification>> {
    const { page, limit, search, dynamicLinkId, userSegmentId } = query;

    if (search) {
      return this.getSearchedUserPushNotifications(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(dynamicLinkId && { dynamicLinkId: new Types.ObjectId(dynamicLinkId) }),
          ...(userSegmentId && { userSegments: { $in: [new Types.ObjectId(userSegmentId)] } }),
        },
      },
    ];

    const [userPushNotifications, [{ total = 0 } = {}]] = await Promise.all([
      this.userPushNotificationModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...getUserPushNotificationsAggregationPipeline(),
      ]),
      this.userPushNotificationModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: userPushNotifications,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedUserPushNotifications({
    page,
    limit,
    search,
    dynamicLinkId,
    userSegmentId,
  }: GetUserPushNotificationsQueryDto): Promise<ResponsePayload<UserPushNotification>> {
    const payload: UserPushNotificationAdminRpcPayload = {
      page,
      limit,
      search,
      dynamicLinkId,
      userSegmentId,
    };

    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USER_PUSH_NOTIFICATIONS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.userSegmentModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getUserPushNotificationsAggregationPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getUserPushNotificationDetails(adminId: string, { userPushNotificationId }: UserPushNotificationIdParamDto) {
    const userPushNotification = await this.populateUserPushNotification(userPushNotificationId);

    if (!userPushNotification) {
      throw new NotFoundException(errorManager.USER_PUSH_NOTIFICATION_NOT_FOUND);
    }

    return userPushNotification;
  }

  async createUserPushNotification(adminId: string, body: CreateUserPushNotificationDto) {
    const { dynamicLinkId, includeAllUsers, scheduledDate, userSegments, name, mediaUpload } = body;

    await this.assertDynamicLinkExists(dynamicLinkId);

    if (!includeAllUsers) {
      await this.assertUserSegmentsExist(userSegments);
    }

    const nameExists = await this.userPushNotificationModel.exists({
      name,
      status: UserPushNotificationStatusEnum.SCHEDULED,
    });

    if (nameExists) {
      throw new ConflictException(errorManager.USER_PUSH_NOTIFICATION_ALREADY_EXISTS);
    }

    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const userPushNotification = new this.userPushNotificationModel();
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [mediaUpload],
        filesS3PathPrefix: `marketing-campaigns`,
        resourceModel: {
          name: UploadModelResources.USER_PUSH_NOTIFICATION_MEDIA,
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
        isUploadedByAdmin: true,
      });

      userPushNotification.set({
        ...body,
        media: media[0],
        mediaProcessingId,
      });

      const savedUserPushNotification = await userPushNotification.save({ session });

      await this.awsSchedulerService.createSchedule({
        FlexibleTimeWindow: {
          Mode: 'OFF',
        },
        Name: `user-push-notification-${this.appConfig.NODE_ENV}-${savedUserPushNotification._id.toString()}`,
        ScheduleExpression: `at(${scheduledDate.toISOString().split('.')[0]})`,
        ScheduleExpressionTimezone: 'UTC',
        Target: {
          Arn: this.appConfig.AWS_SCHEDULER_LAMBDA_PUSH_NOTIFICATIONS_ARN,
          RoleArn: this.appConfig.AWS_SCHEDULER_SERVICE_ROLE_ARN,
          Input: JSON.stringify({
            userPushNotificationId: savedUserPushNotification._id.toString(),
          }),
        },
      });

      await session.commitTransaction();

      return this.populateUserPushNotification(savedUserPushNotification._id);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateUserPushNotification(
    adminId: string,
    { userPushNotificationId }: UserPushNotificationIdParamDto,
    body: UpdateUserPushNotificationDto,
  ) {
    const { includeAllUsers, userSegments, dynamicLinkId, name, mediaUpload, ...restOfBody } = body;
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const userPushNotification = await this.userPushNotificationModel
        .findById(userPushNotificationId)
        .session(session);

      if (!userPushNotification) {
        throw new NotFoundException(errorManager.USER_PUSH_NOTIFICATION_NOT_FOUND);
      }

      if (userPushNotification.status !== UserPushNotificationStatusEnum.SCHEDULED) {
        throw new ConflictException(errorManager.CANNOT_UPDATE_NON_SCHEDULED_USER_PUSH_NOTIFICATION);
      }

      if (dynamicLinkId) {
        await this.assertDynamicLinkExists(dynamicLinkId);
      }

      if (includeAllUsers && userSegments?.length) {
        throw new ConflictException(errorManager.CANNOT_UPDATE_INCLUDE_ALL_USERS_AND_USER_SEGMENTS);
      }

      if (name) {
        const nameExists = await this.userPushNotificationModel.exists({
          name,
          status: UserPushNotificationStatusEnum.SCHEDULED,
          _id: { $ne: userPushNotificationId },
        });

        if (nameExists) {
          throw new ConflictException(errorManager.USER_PUSH_NOTIFICATION_ALREADY_EXISTS);
        }
      }

      if (includeAllUsers) {
        userPushNotification.set({
          userSegments: [],
        });
      }

      if (userSegments?.length) {
        await this.assertUserSegmentsExist(userSegments);

        userPushNotification.set({
          includeAllUsers: false,
          userSegments,
        });
      }

      if (mediaUpload) {
        const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
          files: [mediaUpload],
          filesS3PathPrefix: `marketing-campaigns`,
          resourceModel: {
            name: UploadModelResources.USER_PUSH_NOTIFICATION_MEDIA,
            ...(userPushNotification.mediaProcessingId && {
              mediaProcessingId: userPushNotification.mediaProcessingId,
            }),
          },
          allowedMediaTypes: [MediaTypeEnum.IMAGE],
        });

        userPushNotification.set({
          media: media[0],
          mediaProcessingId,
        });
      }

      userPushNotification.set({
        ...restOfBody,
        dynamicLinkId,
        name,
      });

      await userPushNotification.save({ session });

      if (body.scheduledDate) {
        await this.awsSchedulerService.updateSchedule({
          Name: `user-push-notification-${this.appConfig.NODE_ENV}-${userPushNotification._id.toString()}`,
          ScheduleExpression: `at(${body.scheduledDate.toISOString().split('.')[0]})`,
          ScheduleExpressionTimezone: 'UTC',
        });
      }

      await session.commitTransaction();

      return this.populateUserPushNotification(userPushNotificationId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async cancelUserPushNotification(
    adminId: string,
    { userPushNotificationId }: UserPushNotificationIdParamDto,
    { cancellationReason }: CancelUserPushNotificationDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const userPushNotification = await this.userPushNotificationModel
        .findById(userPushNotificationId)
        .session(session);

      if (!userPushNotification) {
        throw new NotFoundException(errorManager.USER_PUSH_NOTIFICATION_NOT_FOUND);
      }

      if (userPushNotification.status !== UserPushNotificationStatusEnum.SCHEDULED) {
        throw new ConflictException(errorManager.CANNOT_CANCEL_NON_SCHEDULED_USER_PUSH_NOTIFICATION);
      }

      await userPushNotification.cancelDoc(cancellationReason, session);

      await this.awsSchedulerService.deleteSchedule({
        Name: `user-push-notification-${this.appConfig.NODE_ENV}-${userPushNotification._id.toString()}`,
      });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async deleteUserPushNotification(adminId: string, { userPushNotificationId }: UserPushNotificationIdParamDto) {
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const userPushNotification = await this.userPushNotificationModel
        .findById(userPushNotificationId)
        .session(session);

      if (!userPushNotification) {
        throw new NotFoundException(errorManager.USER_PUSH_NOTIFICATION_NOT_FOUND);
      }

      await userPushNotification.deleteDoc(session);

      if (userPushNotification.status === UserPushNotificationStatusEnum.SCHEDULED) {
        await this.awsSchedulerService.deleteSchedule({
          Name: `user-push-notification-${this.appConfig.NODE_ENV}-${userPushNotification._id.toString()}`,
        });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async assertDynamicLinkExists(dynamicLinkId: string | Types.ObjectId) {
    const dynamicLink = await this.dynamicLinkModel.exists({ _id: dynamicLinkId, isArchived: false }).lean();

    if (!dynamicLink) {
      throw new NotFoundException(errorManager.DYNAMIC_LINK_NOT_FOUND);
    }
  }

  private async assertUserSegmentsExist(userSegments: Types.ObjectId[]) {
    const userSegmentsExist = await this.userSegmentModel
      .find({ _id: { $in: userSegments }, isArchived: false }, { _id: 1 })
      .lean();

    if (userSegmentsExist.length !== userSegments.length) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }
  }

  private async populateUserPushNotification(userPushNotificationId: string | Types.ObjectId) {
    const [userPushNotification] = await this.userPushNotificationModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(userPushNotificationId),
        },
      },
      ...getUserPushNotificationAggregationPipeline(),
    ]);

    return userPushNotification;
  }
}
