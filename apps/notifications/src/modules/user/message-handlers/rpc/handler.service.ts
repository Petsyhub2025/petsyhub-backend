import { Injectable } from '@nestjs/common';
import { UserFCMService, ISubscribeUserToTopicRpc, IUnsubscribeUserFromTopicRpc } from '@instapets-backend/common';

@Injectable()
export class UserNotificationsReceiverHandlerService {
  constructor(private readonly userFCMService: UserFCMService) {}

  async subscribeToTopic({ topic, fcmToken, fcmTokens }: ISubscribeUserToTopicRpc) {
    await this.userFCMService.subscribeToTopic(fcmToken ?? fcmTokens, topic);
  }

  async unsubscribeFromTopic({ topic, fcmToken, fcmTokens }: IUnsubscribeUserFromTopicRpc) {
    await this.userFCMService.unsubscribeFromTopic(fcmToken ?? fcmTokens, topic);
  }
}
