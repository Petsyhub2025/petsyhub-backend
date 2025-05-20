import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  AppConfig,
  CustomLoggerService,
  DynamicLink,
  DynamicLinksAdminRpcPayload,
  IDynamicLinkModel,
  IEventModel,
  IFoundPostModel,
  ILostPostModel,
  IPetModel,
  IPostModel,
  ISearchResponseData,
  IUserModel,
  IUserPushNotificationModel,
  Media,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  ShareableDeepLinkModelsEnum,
  UserPushNotificationStatusEnum,
  addMaintainOrderStages,
  addPaginationStages,
  isObjectId,
  isUsername,
} from '@instapets-backend/common';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DynamicLinkIdParamDto, errorManager } from '@notifications/admin/shared';
import axios, { AxiosError } from 'axios';
import { readFile } from 'fs/promises';
import { Auth } from 'googleapis';
import { PipelineStage, Types } from 'mongoose';
import { CreateDynamicLinkDto } from './dto/create-dynamic-link.dto';
import { GetDynamicLinkAnalyticsQueryDto } from './dto/get-dynamic-link-analytics.dto';
import { GetDynamicLinksQueryDto } from './dto/get-dynamic-links.dto';
import { UpdateDynamicLinkDto } from './dto/update-dynamic-link.dto';
import { getDynamicLinksPipeline } from './helpers/dynamic-links-pipeline.helper';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';

type FirebaseAnalyticsData = {
  linkEventStats: {
    platform: 'ANDROID' | 'IOS' | 'DESKTOP' | 'OTHER' | 'UNKNOWN';
    count: number;
    event: string;
  }[];
};

@Injectable()
export class DynamicLinksService {
  constructor(
    @Inject(ModelNames.DYNAMIC_LINK) private dynamicLinkModel: IDynamicLinkModel,
    @Inject(ModelNames.USER_PUSH_NOTIFICATION) private userPushNotificationModel: IUserPushNotificationModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.LOST_POST) private lostPostModel: ILostPostModel,
    @Inject(ModelNames.FOUND_POST) private foundPostModel: IFoundPostModel,
    @Inject(ModelNames.EVENT) private eventModel: IEventModel,
    private readonly amqpConnection: AmqpConnection,
    private readonly appConfig: AppConfig,
    private readonly logger: CustomLoggerService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async getDynamicLinks(adminId: string, query: GetDynamicLinksQueryDto): Promise<ResponsePayload<DynamicLink>> {
    const { limit, page, search, type, isArchived } = query;

    if (search) {
      return this.getSearchedDynamicLinks(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(type && { 'linkedTo.modelType': { $in: type } }),
          ...(isArchived != undefined && { isArchived }),
        },
      },
    ];

    const [dynamicLinks, [{ total = 0 } = {}]] = await Promise.all([
      this.dynamicLinkModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getDynamicLinksPipeline(),
      ]),
      this.dynamicLinkModel.aggregate([...matchStage]).count('total'),
    ]);

    const formattedDynamicLinks = dynamicLinks.map((dynamicLink) => this.formatPopulatedDynamicLink(dynamicLink));

    return {
      data: formattedDynamicLinks,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedDynamicLinks({
    page,
    limit,
    search,
    type,
    isArchived,
  }: GetDynamicLinksQueryDto): Promise<ResponsePayload<DynamicLink>> {
    const payload: DynamicLinksAdminRpcPayload = {
      page,
      limit,
      search,
      type,
      isArchived,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.dynamicLinkModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getDynamicLinksPipeline(),
    ]);

    const formattedDynamicLinks = docs.map((dynamicLink) => this.formatPopulatedDynamicLink(dynamicLink));

    return {
      data: formattedDynamicLinks,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getDynamicLinkById(adminId: string, { dynamicLinkId }: DynamicLinkIdParamDto) {
    const dynamicLink = await this.dynamicLinkModel.findById(dynamicLinkId).lean();

    if (!dynamicLink) {
      throw new NotFoundException(errorManager.DYNAMIC_LINK_NOT_FOUND);
    }

    return this.populateDynamicLink(dynamicLinkId);
  }

  async createDynamicLink(adminId: string, body: CreateDynamicLinkDto) {
    const { linkedTo, title, useLinkedMedia, previewMediaUpload } = body;

    const titleExists = await this.dynamicLinkModel.exists({ title });

    if (titleExists) {
      throw new ConflictException(errorManager.DYNAMIC_LINK_TITLE_ALREADY_EXISTS);
    }

    const dynamicLink = new this.dynamicLinkModel();

    dynamicLink.set({
      ...body,
    });

    if (previewMediaUpload) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [previewMediaUpload],
        filesS3PathPrefix: `marketing-campaigns`,
        resourceModel: {
          name: UploadModelResources.DYNAMIC_LINK_MEDIA,
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
        isUploadedByAdmin: true,
      });

      dynamicLink.set({
        previewMedia: media[0],
        previewMediaProcessingId: mediaProcessingId,
      });
    }

    if (useLinkedMedia && linkedTo) {
      const linkedMedia = await this.getLinkedModelMedia(linkedTo.modelType, linkedTo.modelIdentifier);

      if (!linkedMedia) {
        throw new UnprocessableEntityException(errorManager.LINKED_ENTITY_HAS_NO_LINKED_MEDIA);
      }

      dynamicLink.set({
        linkedMedia,
      });
    }

    const savedDynamicLink = await dynamicLink.save();

    return this.populateDynamicLink(savedDynamicLink._id);
  }

  async updateDynamicLink(adminId: string, { dynamicLinkId }: DynamicLinkIdParamDto, body: UpdateDynamicLinkDto) {
    const { linkedTo, useLinkedMedia, previewMediaUpload, title } = body;

    const oldDynamicLink = await this.dynamicLinkModel.findById(dynamicLinkId);

    if (!oldDynamicLink) {
      throw new NotFoundException(errorManager.DYNAMIC_LINK_NOT_FOUND);
    }

    const userPushNotificationUsedDynamicLink = await this.userPushNotificationModel.exists({
      dynamicLinkId,
      status: UserPushNotificationStatusEnum.SENT,
    });

    if (userPushNotificationUsedDynamicLink) {
      throw new ConflictException(errorManager.CANNOT_UPDATE_DYNAMIC_LINK_USED_BY_SENT_USER_PUSH_NOTIFICATION);
    }

    if (useLinkedMedia == undefined && (previewMediaUpload || linkedTo)) {
      throw new BadRequestException(errorManager.USE_LINKED_MEDIA_NOT_PROVIDED);
    }

    if (title) {
      const titleExists = await this.dynamicLinkModel.exists({ title, _id: { $ne: dynamicLinkId } });

      if (titleExists) {
        throw new ConflictException(errorManager.DYNAMIC_LINK_TITLE_ALREADY_EXISTS);
      }
    }

    if (previewMediaUpload) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [previewMediaUpload],
        filesS3PathPrefix: `marketing-campaigns`,
        resourceModel: {
          name: UploadModelResources.DYNAMIC_LINK_MEDIA,
          ...(oldDynamicLink.previewMediaProcessingId && {
            mediaProcessingId: oldDynamicLink.previewMediaProcessingId,
          }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      oldDynamicLink.set({
        previewMedia: media,
        previewMediaProcessingId: mediaProcessingId,
      });
    }

    oldDynamicLink.set({
      ...body,
    });

    if (useLinkedMedia && linkedTo) {
      const linkedMedia = await this.getLinkedModelMedia(linkedTo.modelType, linkedTo.modelIdentifier);

      if (!linkedMedia) {
        throw new UnprocessableEntityException(errorManager.LINKED_ENTITY_HAS_NO_LINKED_MEDIA);
      }

      oldDynamicLink.set({
        linkedMedia,
      });
    }

    if (useLinkedMedia === false) {
      oldDynamicLink.set({
        linkedMedia: undefined,
      });
    }

    await oldDynamicLink.save();

    return this.populateDynamicLink(dynamicLinkId);
  }

  async deleteDynamicLink(adminId: string, { dynamicLinkId }: DynamicLinkIdParamDto) {
    const dynamicLink = await this.dynamicLinkModel.findById(dynamicLinkId);

    if (!dynamicLink) {
      throw new NotFoundException(errorManager.DYNAMIC_LINK_NOT_FOUND);
    }

    const userPushNotificationUsingDynamicLink = await this.userPushNotificationModel.exists({
      dynamicLinkId,
      status: UserPushNotificationStatusEnum.SCHEDULED,
    });

    if (userPushNotificationUsingDynamicLink) {
      throw new ConflictException(errorManager.DYNAMIC_LINK_IS_BEING_USED_BY_ACTIVE_USER_PUSH_NOTIFICATION);
    }

    await dynamicLink.deleteDoc();
  }

  async archiveDynamicLink(adminId: string, { dynamicLinkId }: DynamicLinkIdParamDto) {
    const dynamicLink = await this.dynamicLinkModel.findById(dynamicLinkId);

    if (!dynamicLink) {
      throw new NotFoundException(errorManager.DYNAMIC_LINK_NOT_FOUND);
    }

    const userPushNotificationUsingDynamicLinkCount = await this.userPushNotificationModel.countDocuments({
      dynamicLinkId,
      status: UserPushNotificationStatusEnum.SCHEDULED,
    });

    if (userPushNotificationUsingDynamicLinkCount > 0) {
      throw new UnprocessableEntityException(
        errorManager.CANNOT_ARCHIVE_DYNAMIC_LINK_USED_BY_SCHEDULED_USER_PUSH_NOTIFICATION(
          userPushNotificationUsingDynamicLinkCount,
        ),
      );
    }

    dynamicLink.set({
      isArchived: true,
    });

    await dynamicLink.save();
  }

  async unarchiveDynamicLink(adminId: string, { dynamicLinkId }: DynamicLinkIdParamDto) {
    const dynamicLink = await this.dynamicLinkModel.findById(dynamicLinkId);

    if (!dynamicLink) {
      throw new NotFoundException(errorManager.DYNAMIC_LINK_NOT_FOUND);
    }

    dynamicLink.set({
      isArchived: false,
    });

    await dynamicLink.save();
  }

  async getDynamicLinkAnalytics(
    adminId: string,
    { dynamicLinkId }: DynamicLinkIdParamDto,
    { days }: GetDynamicLinkAnalyticsQueryDto,
  ) {
    const dynamicLinkDoc = await this.dynamicLinkModel.findById(dynamicLinkId).lean();

    if (!dynamicLinkDoc) {
      throw new NotFoundException(errorManager.DYNAMIC_LINK_NOT_FOUND);
    }

    try {
      const filename = `${this.appConfig.NODE_ENV}-backend-user-firebase-service-account.json`;
      const serviceAccountFile = await readFile(`${process.cwd()}/${filename}`, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountFile);

      const jwtClient = new Auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/firebase'],
      });

      const response = await jwtClient.authorize();

      const accessToken = response?.access_token;

      if (!accessToken) {
        throw new Error('Google Auth JWT client failed to authorize');
      }

      const firebaseAnalyticsUrl = `https://firebasedynamiclinks.googleapis.com/v1/${encodeURIComponent(
        dynamicLinkDoc.dynamicLink,
      )}/linkStats?durationDays=${days}`;
      const { data } = await axios.get<FirebaseAnalyticsData>(firebaseAnalyticsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!data) {
        throw new Error('Firebase analytics API failed to return data');
      }

      const { linkEventStats } = data;
      if (!linkEventStats?.length) {
        return null;
      }

      const reducedLinkEventStats = linkEventStats.reduce((acc, curr) => {
        const { platform: _platform, ...rest } = curr;
        const platform = _platform ? _platform.toLowerCase() : 'unknown';

        acc[platform] = acc[platform] || [];
        acc[platform].push(rest);

        return acc;
      }, {});

      return reducedLinkEventStats;
    } catch (error) {
      this.logger.error(`Failed to get dynamic link analytics: ${error.message}`, {
        error,
        dynamicLinkId,
        adminId,
        days,
      });

      if (error instanceof AxiosError) {
        this.logger.error(`Failed to call firebase analytics API: ${error?.message}`, {
          error: error?.response?.data,
          dynamicLinkId,
          adminId,
          days,
        });
      }

      throw new InternalServerErrorException(errorManager.FAILED_TO_GET_DYNAMIC_LINK_ANALYTICS);
    }
  }

  private async getLinkedModelMedia(modelType: ShareableDeepLinkModelsEnum, modelId: string) {
    const linkedMedia = await this._getLinkedModelMedia(modelType, modelId);

    return this.processLinkedMedia(linkedMedia);
  }

  private async _getLinkedModelMedia(modelType: ShareableDeepLinkModelsEnum, modelId: string) {
    if (!isObjectId(modelId) && modelType !== ShareableDeepLinkModelsEnum.USERS) return null;

    switch (modelType) {
      case ShareableDeepLinkModelsEnum.USERS:
        return this.userModel
          .findOne(
            {
              ...(isObjectId(modelId) && { _id: modelId }),
              ...(!isObjectId && isUsername(modelId) && { username: modelId }),
            },
            { profilePictureMedia: 1 },
          )
          .lean();
      case ShareableDeepLinkModelsEnum.POSTS:
        return this.postModel.findById(modelId, { media: 1 }).lean();
      case ShareableDeepLinkModelsEnum.PETS:
        return this.petModel.findById(modelId, { profilePictureMedia: 1 }).lean();
      case ShareableDeepLinkModelsEnum.LOST_POSTS:
        return this.lostPostModel.findById(modelId, { media: 1 }).lean();
      case ShareableDeepLinkModelsEnum.FOUND_POSTS:
        return this.foundPostModel.findById(modelId, { media: 1 }).lean();
      case ShareableDeepLinkModelsEnum.EVENTS:
        return this.eventModel.findById(modelId, { media: 1 }).lean();
      default:
        return null;
    }
  }

  private processLinkedMedia<T extends { media?: Media[]; profilePictureMedia?: Media }>(model: T): Media {
    if (!model || (!model.media && !model.profilePictureMedia)) return null;

    if (model.media?.length) return model.media?.[0];

    return model.profilePictureMedia;
  }

  private async populateDynamicLink(dynamicLinkId: string | Types.ObjectId) {
    const [dynamicLink] = await this.dynamicLinkModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(dynamicLinkId),
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$linkedTo.modelIdentifier' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$userId', null] }],
                },
              },
            },
            {
              $project: {
                _id: 1,
                profilePictureMedia: 1,
                firstName: 1,
                lastName: 1,
              },
            },
          ],
          as: 'linkedTo.populatedModel',
        },
      },
      {
        $lookup: {
          from: 'pets',
          let: { petId: '$linkedTo.modelIdentifier' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$petId', null] }],
                },
              },
            },
            {
              $project: {
                _id: 1,
                profilePictureMedia: 1,
                name: 1,
              },
            },
          ],
          as: 'linkedTo.populatedModel',
        },
      },
      {
        $unwind: {
          path: '$linkedTo.populatedModel',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          deepLink: 1,
          dynamicLink: 1,
          linkedTo: 1,
          previewDescription: 1,
          previewMedia: 1,
          previewTitle: 1,
          title: 1,
          isArchived: 1,
        },
      },
    ]);

    return this.formatPopulatedDynamicLink(dynamicLink);
  }

  private formatPopulatedDynamicLink(dynamicLink: DynamicLink) {
    // Replace starting chars and after hyphen with their uppercase equivalent
    const formattedLinkedToModelType = dynamicLink.linkedTo?.modelType
      ?.replace(/^([a-z])/, (char) => char.toUpperCase())
      ?.replace(/-([a-z])/g, (char) => char[1].toUpperCase());

    return {
      ...dynamicLink,
      ...(dynamicLink.linkedTo && {
        linkedTo: {
          ...dynamicLink.linkedTo,
          formattedModelType: formattedLinkedToModelType,
        },
      }),
    };
  }
}
