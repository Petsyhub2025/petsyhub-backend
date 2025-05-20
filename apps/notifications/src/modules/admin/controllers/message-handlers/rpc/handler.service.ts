import { Injectable } from '@nestjs/common';
import { AdminFCMService, ISubscribeAdminToTopicRpc, IUnsubscribeAdminFromTopicRpc } from '@instapets-backend/common';

@Injectable()
export class AdminNotificationsReceiverHandlerService {
  constructor(private readonly adminFCMService: AdminFCMService) {}

  async subscribeToTopic({ topic, fcmToken, fcmTokens }: ISubscribeAdminToTopicRpc) {
    await this.adminFCMService.subscribeToTopic(fcmToken ?? fcmTokens, topic);
  }

  async unsubscribeFromTopic({ topic, fcmToken, fcmTokens }: IUnsubscribeAdminFromTopicRpc) {
    await this.adminFCMService.unsubscribeFromTopic(fcmToken ?? fcmTokens, topic);
  }
}
