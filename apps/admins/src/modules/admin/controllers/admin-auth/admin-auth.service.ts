import { RedisService } from '@songkeys/nestjs-redis';
import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Admin,
  AppConfig,
  AwsCognitoService,
  AwsS3Service,
  CustomError,
  CustomLoggerService,
  ErrorType,
  IAdminModel,
  ModelNames,
} from '@instapets-backend/common';
import { LoginTicket, OAuth2Client } from 'google-auth-library';
import Redis from 'ioredis';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { LoginGoogleDto } from './dto/login-google.dto';
import { IRefreshTokenPayload } from './strategies/refresh-token/refresh-token-strategy-payload.interface';

@Injectable()
export class AdminAuthService {
  private readonly redis: Redis;

  constructor(
    @Inject(ModelNames.ADMIN) private adminModel: IAdminModel,
    private readonly appConfig: AppConfig,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly logger: CustomLoggerService,
    private readonly cognitoService: AwsCognitoService,
    private readonly s3Service: AwsS3Service,
  ) {
    this.redis = this.redisService.getClient();
  }

  async loginAdmin({ idToken }: LoginGoogleDto) {
    const client = new OAuth2Client(this.appConfig.ADMIN_GOOGLE_CLIENT_ID);

    let loginTicket: LoginTicket = null;

    try {
      loginTicket = await client.verifyIdToken({
        idToken,
        audience: this.appConfig.ADMIN_GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      this.logger.error('Failed to verify google login token', { error });
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'You are not authorized to access this resource',
            ar: 'ليس لديك صلاحية الوصول إلى هذا المورد',
          },
          event: 'ADMIN_GOOGLE_LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const { email, sub: googleId } = loginTicket.getPayload();

    const admin = await this.adminModel.findOne(
      { email },
      { email: 1, firstName: 1, lastName: 1, title: 1, permissions: 1 },
    );

    if (!admin) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'You are not authorized to access this resource',
            ar: 'ليس لديك صلاحية الوصول إلى هذا المورد',
          },
          event: 'ADMIN_GOOGLE_LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    if (!admin.googleId) {
      admin.set({ googleId });
      await admin.save();
    }

    const { accessToken, refreshToken } = await this.generateTokens(admin);

    return {
      ...admin.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async verifyAdminRefreshToken(payload: IRefreshTokenPayload) {
    const { _id: adminId, sessionId } = payload;

    // Delete current session from redis
    const removeResult = await this.redis.lrem(adminId, 0, sessionId);

    if (removeResult === 0) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid session',
            ar: 'جلسة غير صالحة',
          },
          event: 'INVALID_SESSION',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const admin = await this.adminModel.findById(adminId);

    return admin;
  }

  async generateTokens(admin: HydratedDocument<Admin>) {
    const { accessToken, sessionId: newSessionId } = await this.generateAccessToken(admin);

    const { refreshToken } = await this.generateRefreshToken(admin, newSessionId);

    return {
      accessToken,
      refreshToken,
    };
  }

  getStorageConfig(adminId: string) {
    return this.s3Service.getS3Config();
  }

  getCognitoConfig(adminId: string) {
    return this.cognitoService.getCognitoIdentityConfig();
  }

  async getCognitoCredentials(adminId: string) {
    const cognitoCredentials = await this.cognitoService.getOpenIdTokenForDeveloperIdentity(adminId);

    if (!cognitoCredentials) {
      throw new InternalServerErrorException(
        new CustomError({
          localizedMessage: {
            en: 'Failed to fetch Cognito credentials',
            ar: 'فشل في جلب بيانات الاعتماد من Cognito',
          },
          event: 'COGNITO_CREDENTIALS_FAILED',
        }),
      );
    }

    return cognitoCredentials;
  }

  private async generateAccessToken(admin: HydratedDocument<Admin>) {
    const adminId = admin._id;

    // Generate new session id and save it to redis
    const sessionId = await this.createSession(admin);

    const token = this.jwtService.sign(
      {
        _id: adminId,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        permissions: admin.permissions,
        sessionId,
      },
      {
        secret: this.appConfig.ADMIN_JWT_SECRET,
        expiresIn: this.appConfig.ADMIN_JWT_EXPIRY,
      },
    );

    return {
      accessToken: token,
      sessionId: sessionId,
    };
  }

  private async createSession(admin: HydratedDocument<Admin>) {
    const session = uuidV5(uuidV4(), uuidV4());

    await this.redis.lpush(admin._id?.toString(), session);

    return session;
  }

  private async generateRefreshToken(admin: HydratedDocument<Admin>, sessionId: string) {
    const refreshToken = this.jwtService.sign(
      { sessionId, _id: admin._id },
      {
        secret: this.appConfig.ADMIN_JWT_REFRESH_SECRET,
        expiresIn: this.appConfig.ADMIN_JWT_REFRESH_EXPIRY || 7200,
      },
    );

    return {
      refreshToken,
    };
  }
}
