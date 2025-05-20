import { RedisService } from '@songkeys/nestjs-redis';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig, ICustomerModel, ModelNames } from '@instapets-backend/common';
import { BaseAuthService } from '@customers/customer/controllers/customer-auth/base-auth.service';
import { IRefreshTokenPayload } from './refresh-token-strategy-payload.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RefreshTokenStrategyService extends BaseAuthService {
  constructor(
    @Inject(ModelNames.USER) private _customerModel: ICustomerModel,
    private readonly _appConfig: AppConfig,
    private readonly _jwtService: JwtService,
    private readonly _redisService: RedisService,
    private readonly _eventEmitter: EventEmitter2,
  ) {
    super(_customerModel, _appConfig, _jwtService, _redisService, _eventEmitter);
  }

  async validateCustomerSession(payload: IRefreshTokenPayload) {
    const { _id, sessionId } = payload;

    const customerSessions = await this.redis.lrange(_id, 0, -1);

    if (!customerSessions.includes(sessionId)) {
      return null;
    }

    return sessionId;
  }
}
