import { RedisService } from '@songkeys/nestjs-redis';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig, IUserModel, IUserTopicModel, ModelNames } from '@instapets-backend/common';
import { BaseAuthService } from '@users/user/controllers/user-auth/base-auth.service';
import { IRefreshTokenPayload } from './refresh-token-strategy-payload.interface';

@Injectable()
export class RefreshTokenStrategyService extends BaseAuthService {
  constructor(
    @Inject(ModelNames.USER) private _userModel: IUserModel,
    @Inject(ModelNames.USER_TOPIC) private _userTopicModel: IUserTopicModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
  ) {
    super(_userModel, null, _userTopicModel, _appConfig, _jwtService, _redisService);
  }

  async validateUserSession(payload: IRefreshTokenPayload) {
    const { _id, sessionId } = payload;

    const userSessions = await this.redis.lrange(_id, 0, -1);

    if (!userSessions.includes(sessionId)) {
      return null;
    }

    return sessionId;
  }
}
