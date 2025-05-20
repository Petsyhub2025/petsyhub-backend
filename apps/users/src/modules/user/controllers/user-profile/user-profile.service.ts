import {
  CustomError,
  ErrorType,
  IAreaModel,
  ICityModel,
  ICountryModel,
  ISocketDisconnectionEvent,
  IUserModel,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  User,
  UserBlockHelperService,
  getIsUserFollowed,
} from '@instapets-backend/common';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import { errorManager } from '@users/user/shared/config/errors.config';
import { Types } from 'mongoose';
import { EditProfileDto } from './dto/edit-profile.dto';
import { UserIdOrUsernameParamDto } from './dto/user-id-or-username-param.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Redis } from 'ioredis';
import { RedisService } from '@songkeys/nestjs-redis';

@Injectable()
export class UserProfileService {
  private readonly redis: Redis;

  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.AREA) private areaModel: IAreaModel,
    private readonly userBlockHelperService: UserBlockHelperService,
    private readonly mediaUploadService: MediaUploadService,
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  async editProfile(userId: string, body: EditProfileDto) {
    const { country, city, area, profilePictureMediaUpload } = body;

    const oldUser = await this.userModel.findById(userId);

    if (!oldUser) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'User not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'USER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    const [countryExists, cityExists, areaExists] = await Promise.all([
      this.countryModel.findById(country, { _id: 1 }).lean(),
      this.cityModel.findOne({ _id: city, country: country }, { _id: 1 }).lean(),
      this.areaModel.findOne({ _id: area, city: city }, { _id: 1 }).lean(),
    ]);

    if (country && !countryExists) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'Country is invalid',
            ar: 'البلد غير صالح',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    if (city && !cityExists) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'City is invalid',
            ar: 'المدينة غير صالحة',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    if (area && !areaExists) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'Area is invalid',
            ar: 'المنطقة غير صالحة',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    if (profilePictureMediaUpload) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [profilePictureMediaUpload],
        filesS3PathPrefix: `${userId}/profile`,
        resourceModel: {
          name: UploadModelResources.USER_PROFILE_PICTURE,
          ...(oldUser.profilePictureMediaProcessingId && {
            mediaProcessingId: oldUser.profilePictureMediaProcessingId,
          }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      oldUser.set({
        profilePictureMedia: media[0],
        profilePictureMediaProcessingId: mediaProcessingId,
      });
    }

    oldUser.set({
      ...body,
    });

    await oldUser.save();

    return this.getSelfProfile(userId);
  }

  async getUserProfile(userId: string) {
    const user: User & {
      _id: Types.ObjectId;
      isPetProfileCompleted?: boolean;
      isUserProfileCompleted?: boolean;
    } = await this.getSelfProfile(userId);

    if (!user) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'User not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'USER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    user.totalPets > 0 ? (user.isPetProfileCompleted = true) : (user.isPetProfileCompleted = false);
    user.country && user.city && user.profilePictureMedia && user.birthDate
      ? (user.isUserProfileCompleted = true)
      : (user.isUserProfileCompleted = false);

    return user;
  }

  async getViewedUserProfile(userId: string, { userIdOrUsername }: UserIdOrUsernameParamDto) {
    const isViewedUserIdObjectId = new RegExp('^[0-9a-fA-F]{24}$').test(userIdOrUsername?.toString() ?? '');
    const _user = await this.userModel
      .findOne(
        {
          ...(isViewedUserIdObjectId ? { _id: userIdOrUsername } : { username: userIdOrUsername }),
          isViewable: true,
        },
        {
          _id: 1,
          isPrivate: 1,
        },
      )
      .lean();

    if (!_user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      _user._id,
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    const [user] = await this.userModel.aggregate([
      {
        $match: {
          _id: _user._id,
          isViewable: true,
        },
      },
      ...getIsUserFollowed(userId),
      {
        $project: {
          bio: 1,
          firstName: 1,
          lastName: 1,
          profilePictureMedia: 1,
          username: 1,
          dynamicLink: 1,
          totalPosts: 1,
          totalPets: 1,
          totalFollowers: 1,
          totalUserFollowings: 1,
          totalPetFollowings: 1,
          isFollowed: 1,
          isPendingFollow: 1,
          isFollowingMe: 1,
          isUserPendingFollowOnMe: 1,
          isPrivate: 1,
        },
      },
    ]);

    return user;
  }

  async deleteProfile(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'User not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'USER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    await this.amqpConnection.publish<ISocketDisconnectionEvent>(
      RabbitExchanges.SOCKET_DISCONNECTION,
      RabbitRoutingKeys.SOCKET_DISCONNECTION_EVENTS,
      { socketId: user.socketId },
    );
    await this.redis.del(userId);

    await user.deleteDoc();
  }

  private async getSelfProfile(userId: string) {
    return this.userModel
      .findById(userId)
      .select({
        bio: 1,
        firstName: 1,
        lastName: 1,
        profilePictureMedia: 1,
        username: 1,
        email: 1,
        birthDate: 1,
        gender: 1,
        country: 1,
        city: 1,
        area: 1,
        settings: 1,
        isPrivate: 1,
        isDiscoverable: 1,
        dynamicLink: 1,
        totalPosts: 1,
        totalPets: 1,
        totalFollowers: 1,
        totalUserFollowings: 1,
        totalPetFollowings: 1,
        isDoneOnboarding: 1,
      })
      .populate([
        {
          path: 'country',
          select: {
            name: 1,
            dialCode: 1,
            countryCode: 1,
          },
        },
        {
          path: 'city',
          select: {
            name: 1,
          },
        },
        {
          path: 'area',
          select: {
            name: 1,
          },
        },
      ])
      .lean();
  }
}
