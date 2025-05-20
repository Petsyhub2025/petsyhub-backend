import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import { AppConfig, IServiceProviderModel, ServiceProviderEventsEnum } from '@instapets-backend/common';
import Redis from 'ioredis';
import { Types } from 'mongoose';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BaseAuthService {
  protected readonly redis: Redis;

  constructor(
    protected serviceProviderModel: IServiceProviderModel,
    protected readonly appConfig: AppConfig,
    protected readonly jwtService: JwtService,
    protected readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.redis = this.redisService.getClient();
  }

  async handleServiceProviderLoginAndGenerateTokens(serviceProviderId: string | Types.ObjectId, rememberMe = false) {
    const serviceProvider = await this.findServiceProvider(serviceProviderId);

    const _serviceProvider = await this.serviceProviderModel.findById(serviceProviderId);

    this.eventEmitter.emit(ServiceProviderEventsEnum.SERVICE_PROVIDER_LOGIN_SUCCESS, _serviceProvider);

    return {
      ...serviceProvider,
      ...(await this.generateTokens(serviceProvider, rememberMe)),
    };
  }

  async generateAccessToken(serviceProvider: any, existingSessionId?: string) {
    const serviceProviderId = serviceProvider._id;

    let sessionId = existingSessionId;
    // Generate new session id and save it to redis
    if (!existingSessionId) sessionId = await this.createSession(serviceProvider);

    const token = this.jwtService.sign(
      {
        _id: serviceProviderId,
        sessionId,
        email: serviceProvider.email,
        fullName: serviceProvider.fullName,
        ...(serviceProvider.brandMembership && { brandMembership: serviceProvider.brandMembership }),
      },
      {
        secret: this.appConfig.CLINIC_JWT_SECRET,
        expiresIn: this.appConfig.CLINIC_JWT_EXPIRY || 1200,
      },
    );

    return {
      accessToken: token,
      sessionId: sessionId,
    };
  }

  async createSession(serviceProvider: any) {
    const session = uuidV5(uuidV4(), uuidV4());

    await this.redis.lpush(serviceProvider._id?.toString(), session);

    return session;
  }

  async generateRefreshToken(serviceProvider: any, sessionId: string, rememberMe = false) {
    const refreshToken = this.jwtService.sign(
      {
        sessionId,
        _id: serviceProvider._id,
      },
      {
        secret: this.appConfig.CLINIC_JWT_REFRESH_SECRET,
        expiresIn: rememberMe ? this.appConfig.CLINIC_JWT_REFRESH_EXPIRY : 7200, // 2 hours
      },
    );

    return {
      refreshToken,
    };
  }

  async generateTokens(serviceProvider: any, rememberMe = false) {
    const { accessToken, sessionId: newSessionId } = await this.generateAccessToken(serviceProvider);

    const { refreshToken } = await this.generateRefreshToken(serviceProvider, newSessionId, rememberMe);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async findServiceProvider(serviceProviderId: string | Types.ObjectId) {
    const [serviceProvider] = await this.serviceProviderModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(serviceProviderId),
        },
      },
      {
        $lookup: {
          from: 'brandmemberships',
          let: { serviceProviderId: '$_id' },
          pipeline: [
            {
              $match: {
                isDefault: true,
                $expr: {
                  $eq: ['$serviceProvider', '$$serviceProviderId'],
                },
              },
            },
            {
              $lookup: {
                from: 'brands',
                let: { brandId: '$brand' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$brandId'],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                      logoPictureMedia: 1,
                    },
                  },
                ],
                as: 'brand',
              },
            },
            {
              $unwind: {
                path: '$brand',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'basebranches',
                let: {
                  branchId: '$defaultBranchAccessControl.branch',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$branchId'],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                      branchType: 1,
                    },
                  },
                ],
                as: 'defaultBranchAccessControl.branch',
              },
            },
            {
              $unwind: {
                path: '$defaultBranchAccessControl.branch',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                isDefault: 1,
                brand: 1,
                isBrandOwner: 1,
                defaultBranchAccessControl: 1,
              },
            },
          ],
          as: 'brandMembership',
        },
      },
      {
        $unwind: {
          path: '$brandMembership',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          fullName: 1,
          email: 1,
          isSelfResetPassword: 1,
          brandMembership: 1,
        },
      },
    ]);

    return serviceProvider;
  }
}
