import { CustomResponse } from '@common/classes/custom-response.class';
import { EnvironmentEnum } from '@common/enums';
import { CustomLoggerService } from '@common/modules/common/services/logger';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import {
  UserNotificationValidationDto,
  UserNotificationDto,
} from '@common/schemas/mongoose/notification/notification.type';
import { UserNotification } from '@common/schemas/mongoose/notification/user-notification';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios, { AxiosError } from 'axios';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class NotificationsHelperService {
  private baseUrl: string;
  constructor(
    private readonly appConfig: AppConfig,
    private readonly jwtService: JwtService,
    private readonly logger: CustomLoggerService,
  ) {
    this.baseUrl =
      this.appConfig.NODE_ENV === EnvironmentEnum.LOCAL
        ? `http://localhost:3000`
        : `http://instapets-backend-notifications:3000`;
  }

  async validateNotificationExists(payload: UserNotificationValidationDto) {
    const notificationServiceUrl = `${this.baseUrl}/notifications/user/notifications/validate`;

    const jwt = this.jwtService.sign(
      {},
      {
        secret: this.appConfig.S2S_JWT_SECRET,
        expiresIn: 60,
      },
    );

    try {
      const response = await axios.post<CustomResponse<HydratedDocument<UserNotification>>>(
        notificationServiceUrl,
        {
          ...payload,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'x-api-version': '1',
          },
        },
      );

      return response?.data?.payload?.data as HydratedDocument<UserNotification>;
    } catch (error: unknown) {
      this.logger.error('Error validating notification', { error });

      if (error instanceof AxiosError) {
        this.logger.error(JSON.stringify((error as AxiosError).response?.data, null, 2));
      }

      throw new Error('Error validating notification');
    }
  }

  async sendUserNotificationToNotificationService(notification: UserNotificationDto): Promise<void>;
  async sendUserNotificationToNotificationService(notifications: UserNotificationDto[]): Promise<void>;
  async sendUserNotificationToNotificationService(notifications: UserNotificationDto | UserNotificationDto[]) {
    const isArray = Array.isArray(notifications);
    const singleOrMulti = isArray ? 'multi' : 'single';

    const notificationServiceUrl = `${this.baseUrl}/notifications/user/notifications/send-${singleOrMulti}`;

    const jwt = this.jwtService.sign(
      {},
      {
        secret: this.appConfig.S2S_JWT_SECRET,
        expiresIn: 60,
      },
    );

    try {
      await axios.post(
        notificationServiceUrl,
        {
          ...(isArray ? { notifications } : { notification: notifications }),
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'x-api-version': '1',
          },
        },
      );
    } catch (error: unknown) {
      this.logger.error('Error sending notification', { error });

      if (error instanceof AxiosError) {
        this.logger.error(JSON.stringify((error as AxiosError).response?.data, null, 2));
      }

      throw new Error('Error sending notification');
    }
  }

  async sendUserChatNotificationToNotificationService(notifications: UserNotificationDto[]) {
    const notificationServiceUrl = `${this.baseUrl}/notifications/user/notifications/chat-message`;

    const jwt = this.jwtService.sign(
      {},
      {
        secret: this.appConfig.S2S_JWT_SECRET,
        expiresIn: 60,
      },
    );

    try {
      await axios.post(
        notificationServiceUrl,
        {
          notifications,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'x-api-version': '1',
          },
        },
      );
    } catch (error: unknown) {
      this.logger.error('Error sending notification', { error });

      if (error instanceof AxiosError) {
        this.logger.error(JSON.stringify((error as AxiosError).response?.data, null, 2));
      }

      throw new Error('Error sending notification');
    }
  }
}
