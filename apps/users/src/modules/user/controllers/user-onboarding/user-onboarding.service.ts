import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  ITopicModel,
  IUserBlockModel,
  IUserModel,
  IUserTopicModel,
  Media,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  User,
} from '@instapets-backend/common';
import { errorManager } from '@users/user/shared/config/errors.config';
import { FinalizeOnboardingDto } from './dto/finalize-onboarding.dto';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import { Connection, Types } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class UserOnboardingService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.USER_BLOCK) private userBlockModel: IUserBlockModel,
    @Inject(ModelNames.USER_TOPIC) private userTopicModel: IUserTopicModel,
    @Inject(ModelNames.TOPIC) private readonly topicModel: ITopicModel,
    private readonly mediaUploadService: MediaUploadService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async finalizeOnboarding(userId: string, body: FinalizeOnboardingDto) {
    const { profilePictureMediaUpload, firstName, lastName, gender, userTopics } = body;

    let returnedMediaUploaded: { media: Media[]; mediaProcessingId: string };
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });
    try {
      const user = await this.userModel.findById(userId).session(session);
      this.userOnboardingGuard(user);

      if (profilePictureMediaUpload) {
        returnedMediaUploaded = await this.mediaUploadService.handleMediaUploads({
          files: [profilePictureMediaUpload],
          filesS3PathPrefix: `${userId}/profile`,
          resourceModel: {
            name: UploadModelResources.USER_PROFILE_PICTURE,
            ...(user.profilePictureMediaProcessingId && {
              mediaProcessingId: user.profilePictureMediaProcessingId,
            }),
          },
          allowedMediaTypes: [MediaTypeEnum.IMAGE],
        });
      }

      user.set({
        firstName,
        lastName,
        gender,
        isDoneOnboarding: true,
        ...(returnedMediaUploaded.media?.length && { profilePictureMedia: returnedMediaUploaded.media[0] }),
        ...(returnedMediaUploaded.mediaProcessingId && {
          profilePictureMediaProcessingId: returnedMediaUploaded.mediaProcessingId,
        }),
      });

      await user.save({ session });

      // Check topics existence
      for (let i = 0; i < userTopics.length; i++) {
        if (!(await this.topicModel.findById(userTopics[i]))) {
          throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
        }
      }

      // Check duplications in topics ids
      if (this.hasDuplicates(userTopics.map((userTopic) => String(userTopic)))) {
        throw new BadRequestException(errorManager.TOPICS_DUPLICATED);
      }

      for (let i = 0; i < userTopics.length; i++) {
        const userTopic = new this.userTopicModel();
        userTopic.set({
          user: new Types.ObjectId(userId),
          topic: new Types.ObjectId(userTopics[i]),
        });

        await userTopic.save({ session });
      }

      await session.commitTransaction();

      return await this.getUserFinalizeOnboarding(userId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private userOnboardingGuard(user: User) {
    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (user.isDoneOnboarding) {
      throw new UnauthorizedException(errorManager.ONBOARDING_ALREADY_DONE);
    }
  }

  private hasDuplicates(userTopics: string[]) {
    return new Set(userTopics).size !== userTopics.length;
  }

  private async getUserFinalizeOnboarding(userId: string | Types.ObjectId) {
    const savedUser = (
      await this.userModel
        .findOne(
          { _id: new Types.ObjectId(userId) },
          {
            bio: 1,
            firstName: 1,
            lastName: 1,
            profilePictureMedia: 1,
            username: 1,
            password: 1,
            googleId: 1,
            appleId: 1,
            email: 1,
            birthDate: 1,
            gender: 1,
            country: 1,
            city: 1,
            area: 1,
            role: 1,
            blockedAt: 1,
            blockDuration: 1,
            blockedReason: 1,
            isPrivate: 1,
            isDiscoverable: 1,
            dynamicLink: 1,
            totalPosts: 1,
            totalPets: 1,
            totalFollowers: 1,
            totalUserFollowings: 1,
            totalPetFollowings: 1,
            isDoneOnboarding: 1,
          },
        )
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
    ).toJSON();

    delete savedUser.role;
    delete savedUser.blockedAt;
    delete savedUser.blockDuration;
    delete savedUser.blockReason;

    const userBlockList = await this.userBlockModel.find(
      {
        blocker: new Types.ObjectId(userId),
      },
      {
        blocked: 1,
      },
    );

    const blockedUsers = userBlockList.map((userBlock) => userBlock.blocked.toString());

    const userTopicsList = await this.userTopicModel.find(
      {
        user: new Types.ObjectId(userId),
      },
      {
        topic: 1,
      },
    );

    const userTopics = userTopicsList.map((userTopic) => userTopic.topic.toString());

    return {
      ...savedUser,
      blockedUsers,
      userTopics,
    };
  }
}
