import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AdminFCMService,
  EventListenerErrorHandlerService,
  FCMTokenPayload,
  FCMTopicPayload,
  ServiceProviderFCMService,
  UserFCMService,
} from '@instapets-backend/common';

@Injectable()
export class FCMListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly userFCMService: UserFCMService,
    private readonly adminFCMService: AdminFCMService,
    private readonly serviceProviderFCMService: ServiceProviderFCMService,
  ) {}

  @OnEvent('FCM.sendUserSingleOrMulticast', { promisify: true })
  async handleUserSingleOrMulticast(event: FCMTokenPayload) {
    await this.errorHandler.eventListenerErrorHandler(
      'FCM.sendTokenNotification',
      this.sendUserSingleOrMulticast.bind(this, event),
    );
  }

  @OnEvent('FCM.sendUserBatchNotifications', { promisify: true })
  async handleUserBatchNotifications(event: FCMTokenPayload[]) {
    await this.errorHandler.eventListenerErrorHandler(
      'FCM.sendUserBatchNotifications',
      this.sendBatch.bind(this, event),
    );
  }

  @OnEvent('FCM.sendToAdminTopic', { promisify: true })
  async handleSendToAdminTopic(event: FCMTopicPayload) {
    await this.errorHandler.eventListenerErrorHandler('FCM.sendToAdminTopic', this.sendToAdminTopic.bind(this, event));
  }

  @OnEvent('FCM.sendServiceProviderTokenNotification', { promisify: true })
  async handleServiceProviderSingle(event: FCMTokenPayload) {
    await this.errorHandler.eventListenerErrorHandler(
      'FCM.sendTokenNotification',
      this.sendServiceProviderSingle.bind(this, event),
    );
  }

  @OnEvent('FCM.sendToUserTopic', { promisify: true })
  async handleSendToUserTopic(event: FCMTopicPayload) {
    await this.errorHandler.eventListenerErrorHandler('FCM.sendToUserTopic', this.sendToUserTopic.bind(this, event));
  }

  private async sendUserSingleOrMulticast(event: FCMTokenPayload) {
    if (!event.tokens || !event.tokens.length) {
      return;
    }

    await this.userFCMService.send(event);
  }

  private async sendBatch(event: FCMTokenPayload[]) {
    if (!event?.length) {
      return;
    }

    return this.userFCMService.send(event);
  }

  private async sendToAdminTopic(event: FCMTopicPayload) {
    return this.adminFCMService.send(event);
  }

  private async sendToUserTopic(event: FCMTopicPayload) {
    return this.userFCMService.send(event);
  }

  private async sendServiceProviderSingle(event: FCMTokenPayload) {
    if (!event.tokens || !event.tokens.length) {
      return;
    }

    await this.serviceProviderFCMService.send(event);
  }
}
