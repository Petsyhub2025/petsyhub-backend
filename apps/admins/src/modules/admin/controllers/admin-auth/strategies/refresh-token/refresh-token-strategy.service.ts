import { RedisService } from '@songkeys/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { IRefreshTokenPayload } from './refresh-token-strategy-payload.interface';

@Injectable()
export class RefreshTokenStrategyService {
  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  async validateAdminSession(payload: IRefreshTokenPayload) {
    const { _id, sessionId } = payload;

    const adminSessions = await this.redis.lrange(_id, 0, -1);

    if (!adminSessions.includes(sessionId)) {
      return null;
    }

    return sessionId;
  }
}
