import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import {
  AppConfig,
  CustomError,
  ErrorType,
  IUserBlockModel,
  IUserModel,
  IUserTopicModel,
  User,
  UserRoleEnum,
} from '@instapets-backend/common';
import Redis from 'ioredis';
import { FilterQuery, HydratedDocument, Types } from 'mongoose';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';

@Injectable()
export class BaseAuthService {
  protected readonly redis: Redis;

  constructor(
    protected userModel: IUserModel,
    protected userBlockModel: IUserBlockModel,
    protected userTopicModel: IUserTopicModel,
    protected readonly appConfig: AppConfig,
    protected readonly jwtService: JwtService,
    protected readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  async handleUserLoginAndGenerateTokens(userId: string | Types.ObjectId) {
    const user = await this.userModel.findById(userId);

    if (user.role === UserRoleEnum.SUSPENDED) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Your account is suspended',
            ar: 'تم تعليق حسابك',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const userBlockTime = new Date(user.blockedAt).getTime() + user.blockDuration;

    if (user.role === UserRoleEnum.BLOCKED && userBlockTime > Date.now()) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Your account is blocked, check your email for more details',
            ar: 'تم حظر حسابك ، تحقق من بريدك الإلكتروني لمزيد من التفاصيل',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    if (user.role === UserRoleEnum.BLOCKED && userBlockTime < Date.now()) {
      await user.updateOne({
        $set: {
          role: UserRoleEnum.ACTIVE,
          blockedAt: null,
          blockDuration: 0,
        },
        $unset: {
          blockReason: 1,
        },
      });
    }

    const _user = (await this.findUser({ _id: userId })).toJSON();

    delete _user.role;
    delete _user.blockedAt;
    delete _user.blockDuration;
    delete _user.blockReason;

    const userBlockList = await this.userBlockModel.find(
      {
        blocker: user._id,
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
      ..._user,
      blockedUsers,
      userTopics,
      ...(user.firstName === 'new' ? { firstName: '' } : { firstName: user.firstName }),
      ...(user.lastName === 'user' ? { lastName: '' } : { lastName: user.lastName }),
      ...(await this.generateTokens(user)),
    };
  }

  async generateAccessToken(user: HydratedDocument<User>) {
    const userId = user._id;

    // Generate new session id and save it to redis
    const sessionId = await this.createSession(user);

    const token = this.jwtService.sign(
      { _id: userId, username: user.username, sessionId },
      {
        secret: this.appConfig.USER_JWT_SECRET,
        expiresIn: this.appConfig.USER_JWT_EXPIRY || 1200,
      },
    );

    return {
      accessToken: token,
      sessionId: sessionId,
    };
  }

  async createSession(user: HydratedDocument<User>) {
    const session = uuidV5(uuidV4(), uuidV4());

    await this.redis.lpush(user._id?.toString(), session);

    return session;
  }

  async generateRefreshToken(user: HydratedDocument<User>, sessionId: string) {
    return this.jwtService.sign(
      { sessionId, _id: user._id },
      {
        secret: this.appConfig.USER_JWT_REFRESH_SECRET,
        expiresIn: this.appConfig.USER_JWT_REFRESH_EXPIRY || 7200,
      },
    );
  }

  async generateTokens(user: HydratedDocument<User>) {
    const { accessToken, sessionId: newSessionId } = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user, newSessionId);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async findUser(query: FilterQuery<HydratedDocument<User>>) {
    return this.userModel
      .findOne(query, {
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
      ]);
  }
}
