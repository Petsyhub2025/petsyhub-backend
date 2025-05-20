/* eslint-disable */
import { ModelNames } from '@common/constants';
import { OpsRunner } from '@db-ops/classes/ops-runner.class';
import { ProgressBar } from '@db-ops/decorators/progress-bar.decorator';
import {
  AppConfig,
  AwsS3Service,
  IAdminModel,
  IAdminNotificationModel,
  IBaseLikeModel,
  ICityModel,
  ICommentModel,
  ICommentReplyModel,
  ICountryModel,
  IPetBreedModel,
  IPetFollowModel,
  IPetModel,
  IPetTypeModel,
  IPostModel,
  IUserChatRoomRelationModel,
  IUserFCMTokenModel,
  IUserFollowModel,
  IUserModel,
  IUserNotificationModel,
  LikeType,
  Media,
  MediaOrientationEnum,
  MediaTypeEnum,
  MediaUploadFile,
  MediaUploadService,
  Post,
  User,
  UserChatRoomRelationChatRequestStatusEnum,
  UserFCMService,
  UserFcmTopicsEnum,
  UserRoleEnum,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import {
  MAX_LANDSCAPE_IMAGE_WIDTH,
  MAX_PORTRAIT_IMAGE_WIDTH,
  MAX_SQUARE_IMAGE_WIDTH,
  MIN_LANDSCAPE_IMAGE_HEIGHT,
  MIN_LANDSCAPE_IMAGE_WIDTH,
  MIN_PORTRAIT_IMAGE_HEIGHT,
  MIN_PORTRAIT_IMAGE_WIDTH,
  MIN_SQUARE_IMAGE_HEIGHT,
  MIN_SQUARE_IMAGE_WIDTH,
  SUPPORTED_ASPECT_RATIOS,
} from '@serverless/media-moderation/constants';
import { calculateOrientation } from '@serverless/media-moderation/helpers/media.helper';
import { Types } from 'mongoose';
import sharp from 'sharp';

// NOTE: Functions decorated with ProgressBar decorator must return an async generator function to work properly.
// Also, when using await in the run() or wherever the async generator function is called, you'll get a ts(80007) warning.
// This is because the decorator transforms the descriptor value to an async function. So, while ts cannot infer this during compile time, it will still work as expected during runtime.
// This is the only way I could get a nice progress bar running with db-ops operations without the need to manually maintain counters/add progress bar logic to each operation.
@Injectable()
export class DataTransformationService extends OpsRunner {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
    @Inject(ModelNames.BASE_LIKE) private likeModel: IBaseLikeModel,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    @Inject(ModelNames.PET_BREED) private petBreedModel: IPetBreedModel,
    @Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel,
    @Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel,
    @Inject(ModelNames.ADMIN) private adminModel: IAdminModel,
    @Inject(ModelNames.USER_FCM_TOKEN) private userFCMTokenModel: IUserFCMTokenModel,
    @Inject(ModelNames.USER_CHAT_ROOM_RELATION) private userChatRoomRelationModel: IUserChatRoomRelationModel,
    @Inject(ModelNames.USER_NOTIFICATION) private userNotificationModel: IUserNotificationModel,
    @Inject(ModelNames.ADMIN_NOTIFICATION) private adminNotificationModel: IAdminNotificationModel,
    private readonly userFCMService: UserFCMService,
    private readonly s3Service: AwsS3Service,
    private readonly mediaUploadService: MediaUploadService,
    private readonly appConfig: AppConfig,
  ) {
    super();
  }

  async run() {
    // await this.adjustMediaLinks();
    // await this.deleteBadAuthorUsers();
    // await this.adjustUserRoles();
    // await this.addIsViewable();
    // await this.adjustAllPetTypes();
    // await this.adjustAllUserCountriesAndCities();
    // await this.removeDeletedPetUsers();
    // await this.adjustAuthorPetOwnedByUserPosts();
    // await this.adjustAllUserOnboardingStatuses();
    // await this.adjustAdminPermissions();
    // await this.adjustAllUserFirstAndLastNames();
    // await this.adjustAreaForAllUsers();
    // await this.adjustNonDeletedUsersInPets();
    // await this.adjustUserDevices();
    // await this.adjustUserOwnedPets();
    // await this.adjustUserUsername();
    // await this.subAllUsersFCMTokensToMarketingTopic();
    // await this.adjustUserFollows();
    // await this.adjustUserFCMTokenDups();
    // await this.adjustBaseLikeDups();
    // await this.adjustChatRoomRelations();
    // await this.adjustUserProfileMedia();
    // await this.adjustPetProfileMedia();
    // await this.adjustUserNotificationMedia();
    // await this.adjustAdminNotificationMedia();
    // await this.adjustUserPetCounts();
    // await this.adjustOldPostMediaSchema();
  }

  // async adjustMediaLinks() {
  //   console.log('Running adjustMediaLinks');
  //   const userCursor = this.userModel.find({}).cursor();
  //   for await (const user of userCursor) {
  //     user.profilePictureMedia = user.profilePictureMedia?.replace('spiritude-instapets-api', 'petsy-dev');
  //     await user.save();
  //   }

  //   const postCursor = this.postModel.find({}).cursor();
  //   for await (const post of postCursor) {
  //     for (const media of post.media) {
  //       media.url = media.url.replace('spiritude-instapets-api', 'petsy-dev');
  //     }
  //     await post.save();
  //   }

  //   const petCursor = this.petModel.find({}).cursor();
  //   for await (const pet of petCursor) {
  //     pet.profilePictureMedia = pet.profilePictureMedia?.replace('spiritude-instapets-api', 'petsy-dev');
  //     await pet.save();
  //   }
  // }

  async deleteBadAuthorUsers() {
    console.log('Running deleteBadAuthorUsers');
    const postCursor = this.postModel.find({}).cursor();
    for await (const post of postCursor) {
      const [user, pet] = await Promise.all([
        this.userModel.findById(post.authorUser),
        this.petModel.findById(post.authorPet),
      ]);

      if (!user && !pet) {
        await post.deleteOne();
      }
    }

    const commentCursor = this.commentModel.find({}).cursor();
    for await (const comment of commentCursor) {
      const [user] = await Promise.all([this.userModel.findById(comment.authorUser)]);

      if (!user) {
        await comment.deleteOne();
      }
    }

    const commentReplyCursor = this.commentReplyModel.find({}).cursor();
    for await (const commentReply of commentReplyCursor) {
      const [user] = await Promise.all([this.userModel.findById(commentReply.authorUser)]);

      if (!user) {
        commentReply.deleteOne();
      }
    }

    const likeCursor = this.likeModel.find({}).cursor();
    for await (const like of likeCursor) {
      const [user] = await Promise.all([this.userModel.findById(like.authorUser)]);

      if (!user) {
        like.deleteOne();
      }
    }
  }

  async adjustUserRoles() {
    console.log('Running adjustUserRoles');
    const userCursor = this.userModel.find({}).cursor();

    for await (const user of userCursor) {
      user.role = UserRoleEnum.ACTIVE;
      await user.save();
    }
  }

  async addIsViewable() {
    console.log('Running addIsViewable');
    const postCursor = this.postModel.find({}).cursor();
    for await (const post of postCursor) {
      post.set({ isViewable: true });
      await post.save();
    }

    const petCursor = this.petModel.find({}).cursor();
    for await (const pet of petCursor) {
      pet.set({ isViewable: true });
      await pet.save();
    }

    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      user.set({ isViewable: true });
      await user.save();
    }

    const commentCursor = this.commentModel.find({}).cursor();
    for await (const comment of commentCursor) {
      comment.set({ isViewable: true });
      await comment.save();
    }

    const commentReplyCursor = this.commentReplyModel.find({}).cursor();
    for await (const commentReply of commentReplyCursor) {
      commentReply.set({ isViewable: true });
      await commentReply.save();
    }

    const likeCursor = this.likeModel.find({}).cursor();
    for await (const like of likeCursor) {
      like.set({ isViewable: true });
      await like.save();
    }

    // remaining models
    const countryCursor = this.countryModel.find({}).cursor();
    for await (const country of countryCursor) {
      country.set({ isViewable: true });
      await country.save();
    }

    const cityCursor = this.cityModel.find({}).cursor();
    for await (const city of cityCursor) {
      city.set({ isViewable: true });
      await city.save();
    }

    const petTypeCursor = this.petTypeModel.find({}).cursor();
    for await (const petType of petTypeCursor) {
      petType.set({ isViewable: true });
      await petType.save();
    }

    const petBreedCursor = this.petBreedModel.find({}).cursor();
    for await (const petBreed of petBreedCursor) {
      petBreed.set({ isViewable: true });
      await petBreed.save();
    }

    const userFollowCursor = this.userFollowModel.find({}).cursor();
    for await (const userFollow of userFollowCursor) {
      userFollow.set({ isViewable: true });
      await userFollow.save();
    }

    const petFollowCursor = this.petFollowModel.find({}).cursor();
    for await (const petFollow of petFollowCursor) {
      petFollow.set({ isViewable: true });
      await petFollow.save();
    }
  }

  async adjustAllPetTypes() {
    console.log('Running adjustAllPetTypes');
    const petCursor = this.petModel.find({}).cursor();
    for await (const pet of petCursor) {
      const petTypeExists = await this.petTypeModel.exists({ _id: pet.type });

      if (!petTypeExists) {
        pet.set({
          type: new Types.ObjectId('64bfcaf69da30834d887eccb'),
          breed: new Types.ObjectId('64bfcc2f9da30834d887ece9'),
        });

        await pet.save();
      }
    }
  }

  async adjustAllUserCountriesAndCities() {
    console.log('Running adjustAllUserCountriesAndCities');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      const countryExists = await this.countryModel.exists({ _id: user.country });

      if (!countryExists) {
        user.set({
          country: new Types.ObjectId('64bfca0fac98ff7b1218a92c'),
          city: new Types.ObjectId('64bfcacbac98ff7b1218a93b'),
        });

        await user.save();
      }
    }
  }

  async removeDeletedPetUsers() {
    console.log('Running removeDeletedPetUsers');
    const petCursor = this.petModel.find({}).cursor();
    for await (const pet of petCursor) {
      const user = await this.userModel.findById(pet.user);

      if (!user) {
        await pet.deleteDoc();
      }
    }
  }

  async adjustAuthorPetOwnedByUserPosts() {
    console.log('Running adjustAuthorPetOwnedByUserPosts');
    const postCursor = this.postModel.find({}).cursor();
    for await (const post of postCursor) {
      const pet = await this.petModel.findById(post.authorPet);

      if (pet) {
        const user = await this.userModel.findById(pet.user.userId);

        if (user) {
          post.set({ authorPetOwnedByUser: user._id });
          await post.save();
        }
      }
    }
  }

  async adjustAllUserOnboardingStatuses() {
    console.log('Running adjustAllUserOnboardingStatuses');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      user.set({ isDoneOnboarding: true });
      await user.save();
    }
  }

  async adjustAdminPermissions() {
    console.log('Running adjustAdminPermissions');
    const defaultPermissions = {
      admins: {
        create: false,
        read: false,
        update: false,
        delete: false,
      },
      adminRoles: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
      appVersions: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
      users: {
        read: false,
        update: false,
        filter: false,
      },
      pets: {
        read: false,
        update: false,
        filter: false,
      },
      posts: {
        read: false,
        update: false,
        delete: false,
      },
      comments: {
        read: false,
        update: false,
        delete: false,
      },
      petBreeds: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
      petTypes: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
      moderationReports: {
        read: false,
        update: false,
        delete: false,
      },
      cities: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
      countries: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
      sync: {
        read: false,
        update: false,
      },
      clinicServiceTypes: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
      serviceProviders: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filter: false,
      },
    };

    const adminCursor = this.adminModel.find({}).cursor();
    for await (const admin of adminCursor) {
      const adminPermissions = admin.toJSON().permissions;
      for (const key in adminPermissions) {
        adminPermissions[key] = {
          ...defaultPermissions[key],
          ...Object.keys(adminPermissions[key] ?? {}).reduce((acc, curr) => {
            if (defaultPermissions[key][curr] != undefined) {
              acc[curr] = adminPermissions[key][curr];
            }

            return acc;
          }, {}),
        };
      }

      admin.set({ permissions: adminPermissions });
      await admin.save();
    }
  }

  async adjustAllUserFirstAndLastNames() {
    console.log('Running adjustAllUserFirstAndLastNames');
    const nameRegex = /^[^\d!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]{3,}$/;

    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      const { firstName, lastName } = user;

      if (firstName && !nameRegex.test(firstName)) {
        user.set({ firstName: 'new' });
      }

      if (lastName && !nameRegex.test(lastName)) {
        user.set({ lastName: 'user' });
      }

      await user.save({ validateModifiedOnly: true });
    }
  }

  async adjustAreaForAllUsers() {
    console.log('Running adjustAreaForAllUsers');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      if (user.country && user.city) {
        user.set({ area: new Types.ObjectId('657050ca680f8cb0e3a6c565') });
        await user.save();
      }
    }
  }

  async adjustNonDeletedUsersInPets() {
    console.log('Running adjustNonDeletedUsersInPets');
    const petCursor = this.petModel.aggregate([{ $match: {} }]).cursor();
    for await (const pet of petCursor) {
      if (pet.user?.userId) {
        continue;
      }

      const user = await this.userModel.findById(pet.user, { _id: 1, country: 1, city: 1, area: 1 }).lean();

      const hydratedPet = this.petModel.hydrate(pet);
      if (!user) {
        await hydratedPet.deleteDoc();
      }

      hydratedPet.set({
        user: {
          userId: user._id,
          country: user.country,
          city: user.city,
          area: user.area,
        },
      });

      await hydratedPet.save();
    }
  }

  async adjustUserDevices() {
    console.log('Running adjustUserDevices');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      user.devices = [];
      await user.save();
    }
  }

  async adjustUserOwnedPets() {
    console.log('Running adjustUserOwnedPets');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      const userPets = await this.petModel
        .find({ 'user.userId': user._id, isViewable: true }, { _id: 1, type: 1, status: 1 })
        .lean();

      user.ownedPets = userPets.map((pet) => ({
        petId: pet._id,
        type: pet.type,
        status: pet.status,
      }));

      await user.save();
    }
  }

  async adjustUserUsername() {
    console.log('Running adjustUserUsername');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      if (!user.username.startsWith('newuser')) {
        continue;
      }

      const firstName = user.firstName
        .toLowerCase()
        .trim()
        .replace(/[^A-Z0-9]/gi, '');
      const lastName = user.lastName
        ?.toLowerCase()
        ?.trim()
        ?.replace(/[^A-Z0-9]/gi, '');

      if (!firstName && !lastName) {
        user.username = 'newuser' + (Math.floor(new Date().getTime() / 1000) + Math.floor(Math.random() * 10000));
        await user.save();
        continue;
      }

      const username = `${firstName || ''}${lastName || ''}`;

      const usernameExists = await this.userModel.exists({ username });

      if (usernameExists) {
        const _username = username + (Math.floor(new Date().getTime() / 1000) + Math.floor(Math.random() * 10000));
        user.username = _username.substring(0, 24);
        await user.save();
        continue;
      }

      user.username = username;
      await user.save();
    }
  }

  async subAllUsersFCMTokensToMarketingTopic() {
    console.log('Running subAllUsersFCMTokensToMarketingTopic');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      const userFcmTokens = await this.userFCMTokenModel.find({ user: user._id }, { fcmToken: 1 }).lean();
      const fcmTokens = userFcmTokens.map((token) => token.fcmToken);

      if (!fcmTokens.length) {
        continue;
      }

      await this.userFCMService.subscribeToTopic(fcmTokens, UserFcmTopicsEnum.MARKETING_EN);
    }
  }

  @ProgressBar<DataTransformationService>('adjustUserFollows', async (instance) => {
    const [userFollowCount, petFollowCount, userCount] = await Promise.all([
      instance.userFollowModel.countDocuments(),
      instance.petFollowModel.countDocuments(),
      instance.userModel.countDocuments(),
    ]);

    return userFollowCount + petFollowCount + userCount;
  })
  async *adjustUserFollows() {
    console.log('Running adjustUserFollows');

    const limit = 1;
    let page = 1;
    while (true) {
      const [userFollow] = await this.userFollowModel
        .find({})
        .skip((page++ - 1) * limit)
        .limit(limit);

      if (!userFollow) break;
      yield;

      const { follower, following } = userFollow;

      const duplicateUserFollows = await this.userFollowModel.find({
        follower,
        following,
        _id: { $ne: userFollow._id },
      });

      if (!duplicateUserFollows.length) continue;

      for (const duplicateUserFollow of duplicateUserFollows) {
        await duplicateUserFollow.deleteDoc();
        yield;
      }
    }

    page = 1;
    while (true) {
      const [petFollow] = await this.petFollowModel
        .find({})
        .skip((page++ - 1) * limit)
        .limit(limit);

      if (!petFollow) break;
      yield;

      const { follower, following } = petFollow;

      const duplicatePetFollows = await this.petFollowModel.find({
        follower,
        following,
        _id: { $ne: petFollow._id },
      });

      if (!duplicatePetFollows.length) continue;

      for (const duplicatePetFollow of duplicatePetFollows) {
        await duplicatePetFollow.deleteDoc();
        yield;
      }
    }

    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      const totalUserFollowings = await this.userFollowModel.countDocuments({ follower: user._id });
      const totalPetFollowings = await this.petFollowModel.countDocuments({ follower: user._id });
      const totalFollowers = await this.userFollowModel.countDocuments({ following: user._id });

      user.set({
        totalUserFollowings,
        totalPetFollowings,
        totalFollowers,
      } satisfies Partial<User>);

      await user.save();
      yield;
    }
  }

  @ProgressBar<DataTransformationService>('adjustUserFCMTokenDups', async (instance) => {
    return instance.userFCMTokenModel.countDocuments();
  })
  async *adjustUserFCMTokenDups() {
    console.log('Running adjustUserFCMTokenDups');

    const limit = 1;
    let page = 1;

    while (true) {
      const [userFCMToken] = await this.userFCMTokenModel
        .find({})
        .skip((page++ - 1) * limit)
        .limit(limit);

      if (!userFCMToken) break;
      yield;

      const { fcmToken } = userFCMToken;

      const duplicateUserFCMTokens = await this.userFCMTokenModel.find({
        fcmToken,
        _id: { $ne: userFCMToken._id },
      });

      if (!duplicateUserFCMTokens.length) continue;

      for (const duplicateUserFCMToken of duplicateUserFCMTokens) {
        await duplicateUserFCMToken.deleteOne();
        yield;
      }
    }
  }

  @ProgressBar<DataTransformationService>('adjustBaseLikeDups', async (instance) => {
    return instance.likeModel.countDocuments();
  })
  async *adjustBaseLikeDups() {
    console.log('Running adjustBaseLikeDups');

    const limit = 1;
    let page = 1;

    while (true) {
      const [baseLike] = await this.likeModel
        .aggregate([])
        .skip((page++ - 1) * limit)
        .limit(limit);

      if (!baseLike) break;
      yield;

      const { authorUser, post, comment, commentReply } = baseLike;
      const duplicateBaseLikes = [];

      if (
        (baseLike.likeType === LikeType.POST && !post) ||
        (baseLike.likeType === LikeType.COMMENT && !comment) ||
        (baseLike.likeType === LikeType.COMMENT_REPLY && !commentReply)
      ) {
        await baseLike.deleteOne();
        continue;
      }

      if (post) {
        const duplicatePostLikes = await this.likeModel.find({
          authorUser,
          post,
          _id: { $ne: baseLike._id },
        });

        duplicateBaseLikes.push(...duplicatePostLikes);
      }

      if (comment) {
        const duplicateCommentLikes = await this.likeModel.find({
          authorUser,
          comment,
          _id: { $ne: baseLike._id },
        });

        duplicateBaseLikes.push(...duplicateCommentLikes);
      }

      if (commentReply) {
        const duplicateCommentReplyLikes = await this.likeModel.find({
          authorUser,
          commentReply,
          _id: { $ne: baseLike._id },
        });

        duplicateBaseLikes.push(...duplicateCommentReplyLikes);
      }

      if (!duplicateBaseLikes.length) continue;

      for (const duplicateBaseLike of duplicateBaseLikes) {
        await duplicateBaseLike.deleteOne();
        yield;
      }
    }
  }

  @ProgressBar<DataTransformationService>('adjustChatRoomRelations', async (instance) => {
    return instance.userChatRoomRelationModel.countDocuments();
  })
  async *adjustChatRoomRelations() {
    console.log('Running adjustChatRoomRelations');
    const userChatRoomRelationCursor = this.userChatRoomRelationModel.aggregate([]).cursor();
    for await (const userChatRoomRelation of userChatRoomRelationCursor) {
      const { chatRequestStatus, chatRequesterId } = userChatRoomRelation;

      yield;
      if (chatRequestStatus || chatRequesterId || chatRequesterId === null) continue;

      const hydratedUserChatRoomRelation = this.userChatRoomRelationModel.hydrate(userChatRoomRelation);

      hydratedUserChatRoomRelation.set({
        chatRequestStatus: UserChatRoomRelationChatRequestStatusEnum.NONE,
        chatRequesterId: null,
      });

      await hydratedUserChatRoomRelation.save();
    }
  }

  @ProgressBar<DataTransformationService>('adjustUserProfileMedia', async (instance) => {
    return instance.userModel.countDocuments();
  })
  async *adjustUserProfileMedia() {
    console.log('Running adjustUserProfileMedia');
    const userCursor = this.userModel.aggregate([]).cursor();
    for await (const user of userCursor) {
      yield;

      if (!user.profilePictureUrl || user.profilePictureMedia) {
        continue;
      }

      const media: Media = {
        url: user.profilePictureUrl,
        type: MediaTypeEnum.IMAGE,
        isSensitiveContent: false,
      };

      const hydratedUser = this.userModel.hydrate(user);

      hydratedUser.set('profilePictureMedia', media);
      hydratedUser.set('profilePictureUrl', undefined, { strict: false });
      await hydratedUser.save();
    }
  }

  @ProgressBar<DataTransformationService>('adjustPetProfileMedia', async (instance) => {
    return instance.petModel.countDocuments();
  })
  async *adjustPetProfileMedia() {
    console.log('Running adjustPetProfileMedia');
    const petCursor = this.petModel.aggregate([]).cursor();
    for await (const pet of petCursor) {
      yield;

      if (!pet.profilePictureUrl || pet.profilePictureMedia) {
        continue;
      }

      const media: Media = {
        url: pet.profilePictureUrl,
        type: MediaTypeEnum.IMAGE,
        isSensitiveContent: false,
      };

      const hydratedPet = this.petModel.hydrate(pet);

      hydratedPet.set('profilePictureMedia', media);
      hydratedPet.set('profilePictureUrl', undefined, { strict: false });
      await hydratedPet.save();
    }
  }

  @ProgressBar<DataTransformationService>('adjustUserNotificationMedia', async (instance) => {
    return instance.userNotificationModel.countDocuments();
  })
  async *adjustUserNotificationMedia() {
    console.log('Running adjustUserNotificationMedia');
    const userNotificationCursor = this.userNotificationModel.aggregate([]).cursor();
    for await (const userNotification of userNotificationCursor) {
      yield;

      if (!userNotification.imageUrl || userNotification.imageMedia) {
        continue;
      }

      const media: Media = {
        url: userNotification.imageUrl,
        type: MediaTypeEnum.IMAGE,
        isSensitiveContent: false,
      };

      const hydratedUserNotification = this.userNotificationModel.hydrate(userNotification);

      hydratedUserNotification.set('imageMedia', media);
      hydratedUserNotification.set('imageUrl', undefined, { strict: false });
      await hydratedUserNotification.save();
    }
  }

  @ProgressBar<DataTransformationService>('adjustAdminNotificationMedia', async (instance) => {
    return instance.adminNotificationModel.countDocuments();
  })
  async *adjustAdminNotificationMedia() {
    console.log('Running adjustAdminNotificationMedia');
    const adminNotificationCursor = this.adminNotificationModel.aggregate([]).cursor();
    for await (const adminNotification of adminNotificationCursor) {
      yield;

      if (!adminNotification.imageUrl || adminNotification.imageMedia) {
        continue;
      }

      const media: Media = {
        url: adminNotification.imageUrl,
        type: MediaTypeEnum.IMAGE,
        isSensitiveContent: false,
      };

      const hydratedAdminNotification = this.adminNotificationModel.hydrate(adminNotification);

      hydratedAdminNotification.set('imageMedia', media);
      hydratedAdminNotification.set('imageUrl', undefined, { strict: false });
      await hydratedAdminNotification.save();
    }
  }

  @ProgressBar<DataTransformationService>('adjustUserPetCounts', async (instance) => {
    return instance.userModel.countDocuments();
  })
  async *adjustUserPetCounts() {
    console.log('Running adjustUserPetCounts');
    const userCursor = this.userModel.find({}).cursor();
    for await (const user of userCursor) {
      const petCount = await this.petModel.countDocuments({ 'user.userId': user._id });
      user.set({ totalPets: petCount });
      await user.save();
      yield;
    }
  }

  @ProgressBar<DataTransformationService>('adjustOldPostMediaSchema', async (instance) => {
    return instance.postModel.countDocuments();
  })
  async *adjustOldPostMediaSchema() {
    console.log('Running adjustOldPostMediaSchema');
    const postCursor = this.postModel.aggregate([]).cursor<Hydrate<Post>>();
    for await (const post of postCursor) {
      yield;

      const { media } = post;

      const hasVideoMedia = media.some((m) => m.type === MediaTypeEnum.VIDEO);
      if (hasVideoMedia) {
        continue;
      }

      const isValidMediaSchema = media.some((m) => m.orientation != undefined);
      if (isValidMediaSchema) {
        continue;
      }

      const mediaUploads: MediaUploadFile[] = [];
      let matchingAspectRatio = null;

      try {
        for (const m of media) {
          if (m.type !== MediaTypeEnum.IMAGE) continue;
          const result = await this.handleOldPostImageMediaSchema(m, matchingAspectRatio);
          if (result) {
            matchingAspectRatio = result.aspectRatio; // Use the first image's aspect ratio. It'll be the same for all images in the post after the first image has been processed.
            mediaUploads.push(result.mediaUploadFile);
          }
        }

        const { media: adjustedMedia } = await this.mediaUploadService.handleMediaUploads({
          files: mediaUploads,
          filesS3PathPrefix: `${post.authorUser?.toString() ?? post.authorPetOwnedByUser?.toString()}/posts`,
          resourceModel: {
            name: UploadModelResources.POSTS,
          },
          allowedMediaTypes: [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO, MediaTypeEnum.AUDIO],
          isUploadedByAdmin: true,
        });

        const hydratedPost = this.postModel.hydrate(post);
        hydratedPost.set({ media: adjustedMedia });
        hydratedPost.markModified('media');
        await hydratedPost.save();
      } catch (error) {
        console.error(`Failed to adjust old post media schema. id: ${post._id}`, error);
        continue;
      }
    }
  }

  private async handleOldPostImageMediaSchema(
    media: Media,
    targetAspectRatio: number,
  ): Promise<{ mediaUploadFile: MediaUploadFile; aspectRatio: number } | null> {
    const s3Key = media.url.replace(this.appConfig.MEDIA_DOMAIN + '/', '');
    const imageBuffer = await (await this.s3Service.getObjectFromMediaBucket(s3Key))?.Body?.transformToByteArray?.();

    if (!imageBuffer?.length) {
      return null;
    }

    try {
      const pngBuffer = await sharp(imageBuffer).png().toBuffer();
      const sharpImage = sharp(pngBuffer);
      const metadata = await sharpImage.metadata();

      if (!metadata) {
        console.error('Failed to get image metadata');
        return null;
      }

      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        console.error('Invalid image dimensions');
        return null;
      }

      const originalAspectRatio = width / height;

      let matchedAspectRatio = originalAspectRatio;
      let minDiff = Number.MAX_SAFE_INTEGER;
      SUPPORTED_ASPECT_RATIOS.forEach((ratio) => {
        const diff = Math.abs(ratio - originalAspectRatio);
        if (diff < minDiff) {
          minDiff = diff;
          matchedAspectRatio = ratio;
        }
      });
      const selectedAspectRatio = targetAspectRatio ?? matchedAspectRatio;

      let cropWidth: number, cropHeight: number;
      if (originalAspectRatio > selectedAspectRatio) {
        cropWidth = Math.floor(height * selectedAspectRatio);
        cropHeight = height;
      } else {
        cropWidth = width;
        cropHeight = Math.floor(width / selectedAspectRatio);
      }

      const croppedImage = await sharpImage
        .extract({
          left: Math.floor((width - cropWidth) / 2),
          top: Math.floor((height - cropHeight) / 2),
          width: cropWidth,
          height: cropHeight,
        })
        .toBuffer();

      const sharpCroppedImage = sharp(croppedImage);
      const croppedMetadata = await sharpCroppedImage.metadata();

      if (!croppedMetadata) {
        console.error('Failed to get cropped image metadata');
        return null;
      }

      const croppedWidth = croppedMetadata.width ?? 0;
      const croppedHeight = croppedMetadata.height ?? 0;

      if (croppedWidth <= 0 || croppedHeight <= 0) {
        console.error('Invalid cropped image dimensions');
        return null;
      }

      const orientation = calculateOrientation(croppedWidth, croppedHeight);
      const minWidth =
        orientation === MediaOrientationEnum.PORTRAIT
          ? MIN_PORTRAIT_IMAGE_WIDTH
          : orientation === MediaOrientationEnum.LANDSCAPE
            ? MIN_LANDSCAPE_IMAGE_WIDTH
            : MIN_SQUARE_IMAGE_WIDTH;
      const maxWidth =
        orientation === MediaOrientationEnum.PORTRAIT
          ? MAX_PORTRAIT_IMAGE_WIDTH
          : orientation === MediaOrientationEnum.LANDSCAPE
            ? MAX_LANDSCAPE_IMAGE_WIDTH
            : MAX_SQUARE_IMAGE_WIDTH;

      const minHeight =
        orientation === MediaOrientationEnum.PORTRAIT
          ? MIN_PORTRAIT_IMAGE_HEIGHT
          : orientation === MediaOrientationEnum.LANDSCAPE
            ? MIN_LANDSCAPE_IMAGE_HEIGHT
            : MIN_SQUARE_IMAGE_HEIGHT;

      let newWidth: number, newHeight: number;

      if (width < minWidth) {
        newWidth = minWidth;
      } else if (width > maxWidth) {
        newWidth = maxWidth;
      } else {
        newWidth = width;
      }

      newHeight = Math.max(Math.floor(newWidth / selectedAspectRatio), minHeight);

      const resizedImage = await sharpCroppedImage.resize(newWidth, newHeight).toBuffer();
      // const resizedMetadata = await sharp(resizedImage).metadata();

      const filename = s3Key
        .replace(/\.[^/.]+$/, '.png')
        .split('/')
        .pop();
      const newS3Key = `private/db-ops:db-ops-resized/${filename}`;
      await this.s3Service.uploadObjectToTempMediaBucket(newS3Key, resizedImage);

      // console.log({
      //   mediaUploadFile: {
      //     type: MediaTypeEnum.IMAGE,
      //     s3Key: newS3Key,
      //   },
      //   imageMetadata: resizedMetadata,
      //   // croppedMetadata,
      //   // metadata,
      //   aspectRatio: selectedAspectRatio,
      // });

      return {
        mediaUploadFile: {
          type: MediaTypeEnum.IMAGE,
          s3Key: newS3Key,
        },
        aspectRatio: selectedAspectRatio,
      };
    } catch (error) {
      console.error('Failed to handle old post image media schema', error);
      return null;
    }
  }
}
