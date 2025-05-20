import { RedisService } from '@songkeys/nestjs-redis';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AppConfig, CustomError, ErrorType, IUserModel, ModelNames } from '@instapets-backend/common';
import Redis from 'ioredis';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class UserJWTStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  private readonly redis: Redis;

  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    readonly appConfig: AppConfig,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.USER_JWT_SECRET,
    });

    this.redis = this.redisService.getClient();
  }

  async validate(payload: { _id: string; sessionId: string; iat: number; exp: number }) {
    const [sessions, user] = await Promise.all([
      this.redis.lrange(payload._id, 0, -1),
      this.userModel.findById(payload._id).lean(),
    ]);

    if (!sessions?.length || !sessions?.includes(payload.sessionId) || !user) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Unauthorized',
            ar: 'غير مصرح به هذا الإجراء',
          },
          errorType: ErrorType.UNAUTHORIZED,
          event: 'UNAUTHORIZED_EXCEPTION',
        }),
      );
    }

    return true;
  }
}
