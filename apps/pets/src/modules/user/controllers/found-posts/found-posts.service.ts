import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  AppConfig,
  AwsS3Service,
  BasePaginationQuery,
  GetImagePreSignedUrlQueryDto,
  IFoundPostModel,
  IPetModel,
  IUserModel,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  addPaginationStages,
} from '@instapets-backend/common';
import { errorManager } from '@pets/user/shared/config/error-manager.config';
import { LostFoundLocationHelperService } from '@pets/user/shared/services/lost-found-location-helper.service';
import { Connection, PipelineStage, Types } from 'mongoose';
import { getFoundPostAggregationPipeline } from './aggregations/get-found-post.aggregation';
import { CreateFoundPostDto } from './dto/create-found-post.dto';
import { FoundPostIdParamDto } from './dto/found-post-id-param.dto';
import { UpdateFoundPostDto } from './dto/update-found-post.dto';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';

@Injectable()
export class FoundPostsService {
  constructor(
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.FOUND_POST) private foundPostModel: IFoundPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @InjectConnection() private readonly connection: Connection,
    private readonly lostFoundLocationHelperService: LostFoundLocationHelperService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async getFoundPosts(userId: string, { limit, page }: BasePaginationQuery) {
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

    const [foundPosts, [{ total = 0 } = {}]] = await Promise.all([
      this.foundPostModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        {
          $lookup: {
            from: 'petbreeds',
            let: { breedId: '$foundPet.breed' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $ifNull: ['$$breedId', null] }],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'foundPet.breed',
          },
        },
        {
          $unwind: {
            path: '$foundPet.breed',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'pettypes',
            let: { typeId: '$foundPet.type' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $ifNull: ['$$typeId', null] }],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'foundPet.type',
          },
        },
        {
          $unwind: {
            path: '$foundPet.type',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            media: 1,
            foundAddress: '$locationData.address',
            petType: '$foundPet.type',
            petBreed: '$foundPet.breed',
          },
        },
      ]),
      this.foundPostModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    return {
      data: foundPosts,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getFoundPostDetails(userId: string, { foundPostId }: FoundPostIdParamDto) {
    const foundPost = await this.getFoundPostById(foundPostId, userId);

    if (!foundPost) {
      throw new NotFoundException(errorManager.FOUND_POST_NOT_FOUND);
    }

    return foundPost;
  }

  async createFoundPost(userId: string, body: CreateFoundPostDto) {
    const { location, mediaUploads } = body;

    const foundPostLocation = await this.lostFoundLocationHelperService.getLostFoundPostLocation(location);

    const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
      files: mediaUploads,
      filesS3PathPrefix: `${userId}/found-posts`,
      resourceModel: {
        name: UploadModelResources.FOUND_POSTS,
      },
      allowedMediaTypes: [MediaTypeEnum.IMAGE],
    });

    const foundPost = new this.foundPostModel({
      ...body,
      media,
      mediaProcessingId,
      locationData: foundPostLocation,
      authorUser: userId,
    });
    await foundPost.save();

    return this.getFoundPostById(foundPost._id, userId);
  }

  async updateFoundPost(userId: string, { foundPostId }: FoundPostIdParamDto, body: UpdateFoundPostDto) {
    const { location, mediaUploads } = body;

    const oldFoundPost = await this.foundPostModel.findOne({
      _id: foundPostId,
      authorUser: userId,
      isViewable: true,
    });

    if (!oldFoundPost) {
      throw new NotFoundException(errorManager.FOUND_POST_NOT_FOUND);
    }

    if (location) {
      const foundPostLocation = await this.lostFoundLocationHelperService.getLostFoundPostLocation(location);
      oldFoundPost.set({
        locationData: foundPostLocation,
      });
    }

    if (mediaUploads?.length) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: mediaUploads,
        filesS3PathPrefix: `${userId}/found-posts`,
        resourceModel: {
          name: UploadModelResources.FOUND_POSTS,
          ...(oldFoundPost.mediaProcessingId && { mediaProcessingId: oldFoundPost.mediaProcessingId }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      oldFoundPost.set({
        media,
        mediaProcessingId,
      });
    }

    oldFoundPost.set({
      ...body,
    });

    await oldFoundPost.save();

    return this.getFoundPostById(foundPostId, userId);
  }

  async deleteFoundPost(userId: string, { foundPostId }: FoundPostIdParamDto) {
    const oldFoundPost = await this.foundPostModel.findOne({
      _id: foundPostId,
      authorUser: userId,
      isViewable: true,
    });

    if (!oldFoundPost) {
      throw new NotFoundException(errorManager.FOUND_POST_NOT_FOUND);
    }

    await oldFoundPost.deleteDoc();
  }

  private async getFoundPostById(_id: string | Types.ObjectId, viewerId: string) {
    const [foundPost] = await this.foundPostModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(_id),
        },
      },
      ...getFoundPostAggregationPipeline(viewerId),
    ]);

    return foundPost;
  }
}
