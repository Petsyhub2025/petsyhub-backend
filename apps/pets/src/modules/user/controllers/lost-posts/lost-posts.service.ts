import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AppConfig,
  AwsS3Service,
  BasePaginationQuery,
  GetImagePreSignedUrlQueryDto,
  ILostPostModel,
  IPetModel,
  IUserModel,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  addPaginationStages,
} from '@instapets-backend/common';
import { errorManager } from '@pets/user/shared/config/error-manager.config';
import { CreateLostPostDto } from './dto/create-lost-post.dto';
import { LostFoundLocationHelperService } from '@pets/user/shared/services/lost-found-location-helper.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, PipelineStage, Types } from 'mongoose';
import { getLostPostAggregationPipeline } from './aggregations/get-lost-post.aggregation';
import { UpdateLostPostDto } from './dto/update-lost-post.dto';
import { LostPostIdParamDto } from './dto/lost-post-id-param.dto';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';

@Injectable()
export class LostPostsService {
  constructor(
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.LOST_POST) private lostPostModel: ILostPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @InjectConnection() private readonly connection: Connection,
    private readonly lostFoundLocationHelperService: LostFoundLocationHelperService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async getLostPosts(userId: string, { limit, page }: BasePaginationQuery) {
    const user = await this.userModel.findById(userId, { city: 1 }).lean();

    if (!user?.city) {
      throw new BadRequestException(errorManager.INVALID_LOCATION);
    }

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          'locationData.city': user.city,
          isViewable: true,
        },
      },
    ];

    const [lostPosts, [{ total = 0 } = {}]] = await Promise.all([
      this.lostPostModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        {
          $lookup: {
            from: 'pets',
            let: { petId: '$pet' },
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
                  name: 1,
                },
              },
            ],
            as: 'pet',
          },
        },
        {
          $unwind: {
            path: '$pet',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            media: 1,
            lostAddress: '$locationData.address',
            petName: '$pet.name',
          },
        },
      ]),
      this.lostPostModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    return {
      data: lostPosts,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getLostPostDetails(userId: string, { lostPostId }: LostPostIdParamDto) {
    const lostPost = await this.getLostPostById(lostPostId, userId);

    if (!lostPost) {
      throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
    }

    return lostPost;
  }

  async createLostPost(userId: string, body: CreateLostPostDto) {
    const { location, petId, mediaUploads } = body;

    const [pet, petPostExists] = await Promise.all([
      this.petModel.findOne({
        _id: petId,
        'user.userId': userId,
        isViewable: true,
      }),
      this.lostPostModel.exists({
        pet: petId,
        isViewable: true,
      }),
    ]);

    if (!pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    if (petPostExists) {
      throw new UnprocessableEntityException(errorManager.DUPLICATE_LOST_POST);
    }

    const lostPostLocation = await this.lostFoundLocationHelperService.getLostFoundPostLocation(location);

    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: mediaUploads,
        filesS3PathPrefix: `${userId}/lost-posts`,
        resourceModel: {
          name: UploadModelResources.LOST_POSTS,
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      const lostPost = new this.lostPostModel({
        ...body,
        media,
        mediaProcessingId,
        pet: petId,
        locationData: lostPostLocation,
        authorUser: userId,
      });

      await lostPost.save({ session });

      pet.isLost = true;
      await pet.save({ session });

      await session.commitTransaction();

      return this.getLostPostById(lostPost._id, userId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateLostPost(userId: string, { lostPostId }: LostPostIdParamDto, body: UpdateLostPostDto) {
    const { location, mediaUploads } = body;

    const oldLostPost = await this.lostPostModel.findOne({
      _id: lostPostId,
      authorUser: userId,
      isViewable: true,
    });

    if (!oldLostPost) {
      throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
    }

    if (location) {
      const lostPostLocation = await this.lostFoundLocationHelperService.getLostFoundPostLocation(location);
      oldLostPost.set({
        locationData: lostPostLocation,
      });
    }

    if (mediaUploads?.length) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: mediaUploads,
        filesS3PathPrefix: `${userId}/lost-posts`,
        resourceModel: {
          name: UploadModelResources.LOST_POSTS,
          ...(oldLostPost.mediaProcessingId && { mediaProcessingId: oldLostPost.mediaProcessingId }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      oldLostPost.set({
        media,
        mediaProcessingId,
      });
    }

    oldLostPost.set({
      ...body,
    });

    await oldLostPost.save();

    return this.getLostPostById(lostPostId, userId);
  }

  async markLostPostAsFound(userId: string, { lostPostId }: LostPostIdParamDto) {
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const oldLostPost = await this.lostPostModel
        .findOne({
          _id: lostPostId,
          authorUser: userId,
          isViewable: true,
        })
        .session(session);

      if (!oldLostPost) {
        throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
      }

      oldLostPost.set({
        isFound: true,
      });
      await oldLostPost.save({ session });

      const pet = await this.petModel
        .findOne({
          _id: oldLostPost.pet,
          'user.userId': userId,
          isViewable: true,
        })
        .session(session);

      if (pet) {
        pet.isLost = false;
        await pet.save({ session });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async deleteLostPost(userId: string, { lostPostId }: LostPostIdParamDto) {
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const oldLostPost = await this.lostPostModel
        .findOne({
          _id: lostPostId,
          authorUser: userId,
          isViewable: true,
        })
        .session(session);

      if (!oldLostPost) {
        throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
      }

      await oldLostPost.deleteDoc(session);

      const pet = await this.petModel
        .findOne({
          _id: oldLostPost.pet,
          'user.userId': userId,
          isViewable: true,
        })
        .session(session);

      if (pet) {
        pet.isLost = false;
        await pet.save({ session });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async getLostPostById(_id: string | Types.ObjectId, viewerId: string) {
    const [lostPost] = await this.lostPostModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(_id),
        },
      },
      ...getLostPostAggregationPipeline(viewerId),
    ]);

    return lostPost;
  }
}
