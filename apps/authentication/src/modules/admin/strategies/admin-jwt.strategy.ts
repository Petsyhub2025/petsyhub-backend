import { RedisService } from '@songkeys/nestjs-redis';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AppConfig, CustomError, ErrorType, IAdminModel, ModelNames } from '@instapets-backend/common';
import Redis from 'ioredis';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AdminJWTStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  private readonly redis: Redis;

  constructor(
    @Inject(ModelNames.ADMIN) private adminModel: IAdminModel,
    readonly appConfig: AppConfig,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.ADMIN_JWT_SECRET,
    });

    this.redis = this.redisService.getClient();
  }

  async validate(payload: { _id: string; sessionId: string; iat: number; exp: number }) {
    const [sessions, admin] = await Promise.all([
      this.redis.lrange(payload._id, 0, -1),
      this.adminModel.findById(payload._id).lean(),
    ]);

    if (!sessions?.length || !sessions?.includes(payload.sessionId) || !admin) {
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
