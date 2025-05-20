import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AppConfig,
  AwsS3Service,
  BaseSearchPaginationQuery,
  CustomError,
  ErrorType,
  FollowedPetsUserRpcPayload,
  GetImagePreSignedUrlQueryDto,
  ILostPostModel,
  IPendingPetFollowModel,
  IPetBreedModel,
  IPetFollowModel,
  IPetModel,
  IPetTypeModel,
  ISearchResponseData,
  IUserModel,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  PendingPetFollowEventsEnum,
  Pet,
  PetFollowEventsEnum,
  PetFollowHelperService,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  User,
  UserBlockHelperService,
  UserFollowHelperService,
  UserFollowedPetsRpcPayload,
  addMaintainOrderStages,
  addPaginationStages,
  getIsPetFollowed,
  getIsUserFollowed,
} from '@instapets-backend/common';
import { pendingFollowIdParamDto } from '@pets/user/shared/dto/pending-follow-id-param.dto';
import { PetIdParamDto } from '@pets/user/shared/dto/pet-id-param.dto';
import { Connection, PipelineStage, Types } from 'mongoose';
import { getPetAggregationPipeline } from './aggregations/get-pet-pipeline.aggregation';
import { AddPetDto } from './dto/add-pet.dto';
import { GetPetFollowersQueryDto } from './dto/get-pet-followers.dto';
import { GetUserFollowedPetsQueryDto } from './dto/get-user-followed-pets.dto';
import { GetUserPetsQueryDto } from './dto/get-user-pets.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getFollowedPetsPipeline, getPetFollowersPipeline, getPetsPipeline } from './helpers/pets-pipeline.helper';
import { errorManager } from '@pets/user/shared/config/error-manager.config';
import { PetFollowCreationHelperService } from '@pets/shared/services/pet-follow-creation-helper.service';
import { UpdatePetStatusDto } from './dto/update-pet-status.dto';
import { GetPetPendingFollowersQueryDto } from './dto/get-pet-pending-followers.dto';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class PetsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    @Inject(ModelNames.PET_BREED) private petBreedModel: IPetBreedModel,
    @Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel,
    @Inject(ModelNames.PENDING_PET_FOLLOW) private pendingPetFollowModel: IPendingPetFollowModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.LOST_POST) private lostPostModel: ILostPostModel,
    private readonly petFollowHelperService: PetFollowHelperService,
    private readonly userFollowHelperService: UserFollowHelperService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userBlockHelperService: UserBlockHelperService,
    private readonly amqpConnection: AmqpConnection,
    private readonly petFollowCreationHelperService: PetFollowCreationHelperService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async followPet(userId: string, { petId }: PetIdParamDto) {
    const pet = await this.petModel.findOne({ _id: petId, isViewable: true }, { _id: 0, isPrivate: 1, user: 1 }).lean();

    if (!pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      pet.user.userId.toString(),
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    const oldPetFollow = await this.petFollowModel.exists({ following: petId, follower: userId });

    if (pet.isPrivate && !oldPetFollow) {
      const pendingPetFollow = await this.pendingPetFollowModel.findOne({ following: petId, follower: userId });

      if (pendingPetFollow) {
        throw new ConflictException(
          new CustomError({
            localizedMessage: {
              en: 'Pet follow request already sent',
              ar: 'تم إرسال طلب متابعة الحيوان الأليف بالفعل',
            },
            event: 'PET_FOLLOW_REQUEST_ALREADY_SENT',
            errorType: ErrorType.CONFLICT,
          }),
        );
      }
      const newPendingPetFollow = new this.pendingPetFollowModel({
        following: petId,
        follower: userId,
      });
      const savedPendingFollow = await newPendingPetFollow.save();

      this.eventEmitter.emit(PendingPetFollowEventsEnum.SEND_NOTIFICATION, savedPendingFollow);

      return;
    }

    if (oldPetFollow) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            en: 'Pet already followed',
            ar: 'تم متابعة الحيوان الأليف بالفعل',
          },
          event: 'PET_ALREADY_FOLLOWED',
          errorType: ErrorType.CONFLICT,
        }),
      );
    }

    const savedPetFollow = await this.petFollowCreationHelperService.createPetFollow({
      following: petId,
      follower: userId,
    });

    this.eventEmitter.emit(PetFollowEventsEnum.SEND_NOTIFICATION, savedPetFollow);
  }

  async unFollowPet(userId: string, { petId }: PetIdParamDto) {
    const pet = await this.petModel.findOne({ _id: petId, isViewable: true }, { _id: 0, isPrivate: 1 }).lean();

    if (!pet) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Pet not found',
            ar: 'لم يتم العثور على الحيوان الأليف',
          },
          event: 'PET_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    const [petFollow, pendingPetFollow] = await Promise.all([
      this.petFollowModel.findOne({ following: petId, follower: userId }),
      this.pendingPetFollowModel.findOne({ following: petId, follower: userId }),
    ]);

    if (!petFollow && !pendingPetFollow) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Pet not followed',
            ar: 'لم يتم متابعة الحيوان الأليف',
          },
          event: 'PET_NOT_FOLLOWED',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    if (petFollow) {
      await petFollow.deleteDoc();
    }
    if (pendingPetFollow) {
      await pendingPetFollow.deleteDoc();
    }
  }

  async acceptPendingFollow(userId: string, { pendingFollowId }: pendingFollowIdParamDto) {
    const pendingPetFollow = await this.pendingPetFollowModel.findById(pendingFollowId);

    if (!pendingPetFollow) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Pending follow not found',
            ar: 'لم يتم العثور على طلب المتابعة',
          },
          event: 'PENDING_FOLLOW_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      pendingPetFollow.follower.toString(),
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (
      await this.petFollowModel.exists({ following: pendingPetFollow.following, follower: pendingPetFollow.follower })
    ) {
      await pendingPetFollow.deleteDoc();

      return;
    }

    const userFollow = new this.petFollowModel({
      follower: pendingPetFollow.follower,
      following: pendingPetFollow.following,
    });

    await Promise.all([userFollow.save(), pendingPetFollow.deleteDoc()]);
  }

  async declinePendingFollow(userId: string, { pendingFollowId }: pendingFollowIdParamDto) {
    const pendingPetFollow = await this.pendingPetFollowModel.findById(pendingFollowId);

    if (!pendingPetFollow) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Pending follow not found',
            ar: 'لم يتم العثور على طلب المتابعة',
          },
          event: 'PENDING_FOLLOW_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    await pendingPetFollow.deleteDoc();
  }

  async cancelPendingFollow(userId: string, { petId }: PetIdParamDto) {
    const pendingPetFollow = await this.pendingPetFollowModel.findOne({ following: petId, follower: userId });

    if (!pendingPetFollow) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Pending follow not found',
            ar: 'لم يتم العثور على طلب المتابعة',
          },
          event: 'PENDING_FOLLOW_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    await pendingPetFollow.deleteDoc();
  }

  async getUserPets(userId: string, query: GetUserPetsQueryDto) {
    const { isPrivate, limit, page, userId: targetUserId, excludePetId } = query;

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      targetUserId,
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          'user.userId': new Types.ObjectId(targetUserId || userId),
          ...(isPrivate !== undefined && { isPrivate }),
          ...(excludePetId && { _id: { $ne: new Types.ObjectId(excludePetId) } }),
          isViewable: true,
        },
      },
    ];

    const [pets, [{ total = 0 } = {}]] = await Promise.all([
      this.petModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getPetAggregationPipeline(userId),
      ]),
      this.petModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    return {
      data: pets,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async getUserFollowedPets(userId: string, query: GetUserFollowedPetsQueryDto): Promise<ResponsePayload<Pet>> {
    const { limit, page, excludePetId, userId: targetUserId, search } = query;

    const [targetUser, areUsersMutuallyOrPartiallyBlocked] = await Promise.all([
      this.userModel.findOne({ _id: targetUserId, isViewable: true }),
      this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(userId, targetUserId),
    ]);

    if (
      targetUserId &&
      (!targetUser ||
        !(await this.userFollowHelperService.canUserViewUserContent(targetUser, userId)) ||
        areUsersMutuallyOrPartiallyBlocked)
    ) {
      throw new NotFoundException(new CustomError(errorManager.PET_NOT_FOUND));
    }

    if (search) {
      return this.getSearchedFollowedPets(userId, query);
    }

    const matchStage = [
      {
        $match: {
          follower: new Types.ObjectId(targetUserId || userId),
          following: { $ne: new Types.ObjectId(excludePetId) },
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.petFollowModel.aggregate(matchStage).count('total'),
      this.petFollowModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getFollowedPetsPipeline(userId),
      ]),
    ]);

    return {
      data: docs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  private async getSearchedFollowedPets(
    userId: string,
    { page, limit, search, excludePetId, userId: targetUserId }: GetUserFollowedPetsQueryDto,
  ): Promise<ResponsePayload<Pet>> {
    const payload: FollowedPetsUserRpcPayload = {
      page,
      limit,
      search,
      userId,
      excludePetId,
      targetUserId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_FOLLOWED_PETS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.petFollowModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getFollowedPetsPipeline(userId),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getPetPendingFollowers(userId: string, { page, limit, petId }: GetPetPendingFollowersQueryDto) {
    const pets = await this.petModel
      .find(
        {
          ...(petId && { _id: petId }),
          'user.userId': userId,
          isViewable: true,
        },
        { _id: 1 },
      )
      .lean();
    const petIds = pets.map((p) => p._id);
    const [followers, total] = await Promise.all([
      this.pendingPetFollowModel.aggregate([
        {
          $match: {
            following: {
              $in: petIds,
            },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        {
          $lookup: {
            from: 'users',
            let: { userId: '$follower' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $ifNull: ['$$userId', null] }],
                  },
                },
              },
              ...getIsUserFollowed(userId),
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  username: 1,
                  profilePictureMedia: 1,
                  isFollowed: 1,
                  isPendingFollow: 1,
                  isFollowingMe: 1,
                  isUserPendingFollowOnMe: 1,
                },
              },
            ],
            as: 'follower',
          },
        },
        {
          $unwind: {
            path: '$follower',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'pets',
            let: { petId: '$following' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $ifNull: ['$$petId', null] }],
                  },
                },
              },
              ...getIsPetFollowed(userId),
              {
                $project: {
                  name: 1,
                  profilePictureMedia: 1,
                  isFollowed: 1,
                  isPendingFollow: 1,
                },
              },
            ],
            as: 'following',
          },
        },
        {
          $unwind: {
            path: '$following',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            follower: 1,
            following: 1,
          },
        },
      ]),
      this.pendingPetFollowModel.countDocuments({
        following: {
          $in: petIds,
        },
      }),
    ]);

    return {
      data: followers,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async getPetFollowers(userId: string, query: GetPetFollowersQueryDto): Promise<ResponsePayload<User>> {
    const { petId, limit, page, recent, search } = query;

    const pet = await this.petModel.findOne({ _id: petId, isViewable: true });

    if (!pet) {
      throw new NotFoundException(new CustomError(errorManager.PET_NOT_FOUND));
    }

    const isPetOwnedByUser = pet.user.userId.toString() === userId;

    if (!isPetOwnedByUser && !(await this.petFollowHelperService.canUserViewPetContent(pet, userId))) {
      throw new NotFoundException(new CustomError(errorManager.PET_NOT_FOUND));
    }

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      pet.user.userId.toString(),
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    if (search) {
      return this.getSearchedPetFollowers(userId, query);
    }

    const matchStage = [
      {
        $match: {
          following: new Types.ObjectId(petId),
          ...(recent && {
            createdAt: {
              $gte: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days
            },
          }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.petFollowModel.aggregate(matchStage).count('total'),
      this.petFollowModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getPetFollowersPipeline(userId),
      ]),
    ]);

    return {
      data: docs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  private async getSearchedPetFollowers(
    userId: string,
    { page, limit, search, recent, petId }: GetPetFollowersQueryDto,
  ): Promise<ResponsePayload<User>> {
    const payload: UserFollowedPetsRpcPayload = {
      page,
      limit,
      search,
      recent,
      petId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_PET_FOLLOWERS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.petFollowModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getPetFollowersPipeline(userId),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async addPet(userId: string, body: AddPetDto) {
    if (!(await this.petTypeModel.exists({ _id: body.type }))) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }
    const breed = await this.petBreedModel.findById(body.breed, { _id: 1, type: 1 });

    if (!breed) {
      throw new NotFoundException(errorManager.PET_BREED_NOT_FOUND);
    }

    if (breed.type.toString() !== body.type.toString()) {
      throw new BadRequestException(errorManager.PET_BREED_NOT_SAME_TYPE);
    }

    const user = await this.userModel.findById(userId, { _id: 0, country: 1, city: 1, area: 1 }).lean();

    if (!user) {
      throw new InternalServerErrorException(errorManager.USER_NOT_FOUND);
    }

    const { profilePictureMediaUpload } = body;
    const newPet = new this.petModel();

    if (profilePictureMediaUpload) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [profilePictureMediaUpload],
        filesS3PathPrefix: `${userId}/pets`,
        resourceModel: {
          name: UploadModelResources.PET_PROFILE_PICTURE,
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      newPet.set({
        profilePictureMedia: media[0],
        profilePictureMediaProcessingId: mediaProcessingId,
      });
    }

    newPet.set({
      ...body,
      user: {
        userId: new Types.ObjectId(userId),
        ...user,
      },
    });

    await newPet.save();

    const [pet] = await this.petModel.aggregate([
      {
        $match: {
          _id: newPet._id,
        },
      },
      ...getPetAggregationPipeline(userId),
    ]);

    return pet;
  }

  async updatePet(userId: string, body: UpdatePetDto, { petId }: PetIdParamDto) {
    const { type, breed } = body;
    const oldPet = await this.petModel.findOne({ _id: petId, isViewable: true });

    if (!oldPet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    if (oldPet.user.userId.toString() !== userId) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    if (type && !(await this.petTypeModel.exists({ _id: type }))) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }

    if (breed) {
      const _breed = await this.petBreedModel.findById(breed, { _id: 1, type: 1 });

      if (!_breed) {
        throw new NotFoundException(errorManager.PET_BREED_NOT_FOUND);
      }

      if (type && _breed.type.toString() !== type.toString()) {
        throw new BadRequestException(errorManager.PET_BREED_NOT_SAME_TYPE);
      }

      if (!type && _breed.type.toString() !== oldPet.type.toString()) {
        throw new BadRequestException(errorManager.PET_BREED_NOT_SAME_TYPE);
      }
    }

    const { profilePictureMediaUpload } = body;
    if (profilePictureMediaUpload) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [profilePictureMediaUpload],
        filesS3PathPrefix: `${userId}/pets`,
        resourceModel: {
          name: UploadModelResources.PET_PROFILE_PICTURE,
          ...(oldPet.profilePictureMediaProcessingId && { mediaProcessingId: oldPet.profilePictureMediaProcessingId }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      oldPet.set({
        profilePictureMedia: media[0],
        profilePictureMediaProcessingId: mediaProcessingId,
      });
    }

    oldPet.set({
      ...body,
    });

    await oldPet.save();

    const [pet] = await this.petModel.aggregate([
      {
        $match: {
          _id: oldPet._id,
        },
      },
      ...getPetAggregationPipeline(userId),
    ]);

    return pet;
  }

  async updatePetStatus(userId: string, { petId }: PetIdParamDto, { status }: UpdatePetStatusDto) {
    const pet = await this.petModel.findOne({ _id: petId, isViewable: true, 'user.userId': userId });

    if (!pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    pet.set({
      status,
    });

    await pet.save();
  }

  async removePetStatus(userId: string, { petId }: PetIdParamDto) {
    const pet = await this.petModel.findOne({ _id: petId, isViewable: true, 'user.userId': userId });

    if (!pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    pet.set({
      status: undefined,
    });

    await pet.save();
  }

  async markPetAsFound(userId: string, { petId }: PetIdParamDto) {
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const lostPost = await this.lostPostModel
        .findOne({
          authorUser: userId,
          pet: petId,
          isViewable: true,
        })
        .session(session);

      if (!lostPost) {
        throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
      }

      lostPost.set({
        isFound: true,
      });
      await lostPost.save({ session });

      const pet = await this.petModel
        .findOne({
          _id: lostPost.pet,
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

  async getPet(userId: string, { petId }: PetIdParamDto) {
    const pet = await this.petModel.findOne({ _id: petId, isViewable: true }, { _id: 1, isPrivate: 1, user: 1 }).lean();

    if (!pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    const showPrivate = pet.user.userId.toString() === userId;

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      pet.user.userId.toString(),
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    const [populatedPet] = await this.petModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(petId),
        },
      },
      ...getPetAggregationPipeline(userId, showPrivate),
    ]);

    return populatedPet;
  }

  async deletePet(userId: string, { petId }: PetIdParamDto) {
    const pet = await this.petModel.findOne({ _id: petId, isViewable: true });

    if (!pet) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Pet not found',
            ar: 'لم يتم العثور على الحيوان الأليف',
          },
          event: 'PET_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    if (pet.user.userId.toString() !== userId) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Pet not found',
            ar: 'لم يتم العثور على الحيوان الأليف',
          },
          event: 'PET_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    await pet.deleteDoc();
  }

  async getPets(userId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<Pet>> {
    const { page, limit, search } = query;

    if (search) {
      return this.getSearchedPets(userId, query);
    }
    const matchStage = [
      {
        $match: {
          isViewable: true,
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.petModel.aggregate(matchStage).count('total'),
      this.petModel.aggregate([...matchStage, ...addPaginationStages({ limit, page }), ...getPetsPipeline(userId)]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedPets(
    userId: string,
    { page, limit, search }: BaseSearchPaginationQuery,
  ): Promise<ResponsePayload<Pet>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_PETS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.petModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getPetsPipeline(userId),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }
}
