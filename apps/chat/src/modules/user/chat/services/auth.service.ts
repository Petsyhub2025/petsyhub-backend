import {
  AppConfig,
  CustomLoggerService,
  ErrorType,
  IUserModel,
  ModelNames,
  SocketEventsEnum,
  UserJwtPersona,
  UserSocketStatusEnum,
  WsCustomError,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class AuthService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
    private readonly logger: CustomLoggerService,
  ) {}

  async handleUserConnection(client: Socket) {
    try {
      const user = await this.verifyUserAuth(client);

      if (!user) {
        return;
      }

      user.set({
        socketId: client.id,
        lastSocketActiveDate: new Date(),
        socketStatus: UserSocketStatusEnum.ONLINE,
      });

      await user.save();

      return user;
    } catch (error) {
      this.logger.error(error?.message, { error, clientHandshake: client.handshake });

      client.emit(
        SocketEventsEnum.EXCEPTION,
        new WsCustomError({
          localizedMessage: {
            en: 'An unknown error occurred',
            ar: 'حدث خطأ غير معروف',
          },
          errorType: ErrorType.UNKNOWN,
        }),
      );
    }
  }

  async handleUserDisconnection(client: Socket) {
    try {
      const user = await this.decodeUserToken(client);

      if (!user) {
        return;
      }

      user.set({
        socketId: null,
        lastSocketActiveDate: new Date(),
        socketStatus: UserSocketStatusEnum.OFFLINE,
      });

      await user.save();

      // Remove any underlying connection just in case
      client.disconnect(true);

      return user;
    } catch (error) {
      this.logger.error(error?.message, { error, clientHandshake: client.handshake });
    }
  }

  private async verifyUserAuth(client: Socket) {
    try {
      const { bearer: handshakeAuthToken } = client.handshake.auth as { bearer: string };
      const headerToken = client.handshake.headers?.authorization?.split(' ')?.[1];
      const token = handshakeAuthToken || headerToken;

      if (!token) {
        throw new Error('No token provided');
      }

      const { _id } = this.jwtService.verify<UserJwtPersona>(token, {
        secret: this.appConfig.USER_JWT_SECRET,
      });

      return this.userModel.findById(_id);
    } catch (error) {
      this.logger.error(error?.message, { error, clientHandshake: client.handshake });
      client.emit(
        SocketEventsEnum.EXCEPTION,
        new WsCustomError({
          localizedMessage: {
            en: 'Invalid credentials',
            ar: 'بيانات الاعتماد غير صالحة',
          },
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
      client.disconnect(true);
      return null;
    }
  }

  private decodeUserToken(client: Socket) {
    try {
      const { bearer: handshakeAuthToken } = client.handshake.auth as { bearer: string };
      const headerToken = client.handshake.headers?.authorization?.split(' ')?.[1];
      const token = handshakeAuthToken || headerToken;

      if (!token) {
        throw new Error('No token provided');
      }

      const { _id } = this.jwtService.decode(token) as UserJwtPersona;

      return this.userModel.findById(_id);
    } catch (error) {
      this.logger.error(error?.message, { error, clientHandshake: client.handshake });
      return null;
    }
  }
}
