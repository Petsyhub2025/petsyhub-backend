import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AppConfig, CustomError, ErrorType, IAdminModel, ModelNames } from '@instapets-backend/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IRefreshTokenPayload } from './refresh-token-strategy-payload.interface';
import { RefreshTokenStrategyService } from './refresh-token-strategy.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'admin-refresh-token') {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly refreshTokenStrategyService: RefreshTokenStrategyService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.ADMIN_JWT_REFRESH_SECRET,
    });
  }

  async validate(payload: IRefreshTokenPayload) {
    const session = this.refreshTokenStrategyService.validateAdminSession(payload);

    if (!session) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Unfortunately, your session is expired',
            ar: 'للأسف ، جلستك منتهي',
          },
          event: 'REFRESH_TOKEN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    return payload;
  }
}
