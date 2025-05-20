import { NotificationPriorityEnum } from '@common/schemas/mongoose/notification/notification.enum';
import { Injectable, Logger } from '@nestjs/common';
import firebaseAdmin from 'firebase-admin';
import { FCMTokenPayload, FCMTopicPayload } from '@common/modules/fcm/interfaces/fcm-payload.interface';

type Message = firebaseAdmin.messaging.Message;
type MulticastMessage = firebaseAdmin.messaging.MulticastMessage;

type SendResponse = firebaseAdmin.messaging.BatchResponse | string;
@Injectable()
export class SharedFCMService {
  private logger: Logger = new Logger('FCM Logger');
  protected fcmApp: firebaseAdmin.messaging.Messaging;

  constructor(private firebaseApp: firebaseAdmin.app.App) {
    if (!firebaseApp) {
      throw new Error('Firebase app has failed to initialize');
    }

    this.fcmApp = this.firebaseApp.messaging();
  }

  async send(payload: FCMTokenPayload, dryRun?: boolean): Promise<SendResponse>;
  async send(payload: FCMTokenPayload[], dryRun?: boolean): Promise<firebaseAdmin.messaging.BatchResponse>;
  async send(payload: FCMTopicPayload, dryRun?: boolean): Promise<SendResponse>;
  async send(payload: FCMTopicPayload[], dryRun?: boolean): Promise<firebaseAdmin.messaging.BatchResponse>;
  async send(
    payload: FCMTokenPayload | FCMTokenPayload[] | FCMTopicPayload | FCMTopicPayload[],
    dryRun = false,
  ): Promise<SendResponse> {
    if (Array.isArray(payload)) {
      return await this.bulkMessageSend(payload, dryRun);
    }

    if (this.isFCMTokenPayload(payload)) {
      if (payload.tokens.length > 1) return await this.multicastSend(payload, dryRun);

      return await this.singleTokenSend(payload, dryRun);
    } else if (this.isFCMTopicPayload(payload)) {
      return await this.topicSend(payload, dryRun);
    }
  }

  async subscribeToTopic(tokenOrTokens: string | string[], topic: string): Promise<void> {
    await this.fcmApp.subscribeToTopic(tokenOrTokens, topic);
  }

  async unsubscribeFromTopic(tokenOrTokens: string | string[], topic: string): Promise<void> {
    await this.fcmApp.unsubscribeFromTopic(tokenOrTokens, topic);
  }

  private async topicSend(payload: FCMTopicPayload, dryRun = false) {
    const message = this.generateMessage(payload, false);

    try {
      return await this.fcmApp.send(message as Message, dryRun);
    } catch (e) {
      this.logger.error('Error sending FCM topic message' + e?.message, { error: e });
      throw e;
    }
  }

  private async singleTokenSend(payload: FCMTokenPayload, dryRun = false) {
    const message = this.generateMessage(payload);

    try {
      return await this.fcmApp.send(message as Message, dryRun);
    } catch (e) {
      this.logger.error('Error sending FCM single token message' + e?.message, { error: e });
      throw e;
    }
  }

  private async multicastSend(payload: FCMTokenPayload, dryRun = false) {
    const generatedMessage = this.generateMessage(payload, true) as MulticastMessage;
    const messages: MulticastMessage[] = [];

    // If message.tokens.length > 500, split the tokens into chunks of 500 and send them separately
    while (generatedMessage.tokens.length) {
      messages.push({
        ...generatedMessage,
        tokens: generatedMessage.tokens.splice(0, 500),
      });
    }

    try {
      const result: firebaseAdmin.messaging.BatchResponse = {
        successCount: 0,
        failureCount: 0,
        responses: [],
      };

      for (const message of messages) {
        const response = await this.fcmApp.sendEachForMulticast(message, dryRun);
        result.successCount += response.successCount;
        result.failureCount += response.failureCount;
        result.responses.push(...response.responses);
      }

      return result;
    } catch (e) {
      this.logger.error('Error sending FCM multicast message' + e?.message, { error: e });
      throw e;
    }
  }

  private async bulkMessageSend(payload: FCMTokenPayload[] | FCMTopicPayload[], dryRun = false) {
    const multiTokenMessages = payload.map((item: FCMTokenPayload | FCMTopicPayload) =>
      this.generateMessage(item, true),
    );
    const messages: Message[] = [];

    multiTokenMessages.forEach((message: MulticastMessage) => {
      if (!message.tokens?.length) return;

      messages.push(
        ...message.tokens.map((token: string) => {
          return {
            ...message,
            tokens: undefined,
            token,
          };
        }),
      );
    });

    const result: firebaseAdmin.messaging.BatchResponse = {
      successCount: 0,
      failureCount: 0,
      responses: [],
    };
    try {
      let _messages: Message[];
      while ((_messages = messages.splice(0, 500)).length) {
        const response = await this.fcmApp.sendEach(_messages, dryRun);
        result.successCount += response.successCount;
        result.failureCount += response.failureCount;
        result.responses.push(...response.responses);
      }

      return result;
    } catch (e) {
      this.logger.error('Error sending FCM bulk message' + e?.message, { error: e });
      throw e;
    }
  }

  private generateMessage(
    payload: FCMTokenPayload | FCMTopicPayload,
    multicast = false,
    clientAutoNotification = true,
  ): Message | MulticastMessage {
    let tokens: string[], topic: string;

    const { body, title, data, imageUrl, priority = 'normal', timeToLive = 24 * 60 * 60 } = payload;
    if (this.isFCMTokenPayload(payload)) {
      ({ tokens } = payload);
    } else if (this.isFCMTopicPayload(payload)) {
      ({ topic } = payload);
    }

    if (multicast && topic) {
      throw new Error('Invalid FCM payload: multicast and topic cannot be used together');
    }

    if (multicast && !tokens?.length) {
      throw new Error('Invalid FCM payload: multicast requires at least one token');
    }

    if ((!tokens?.length && !topic) || (tokens?.length && topic)) {
      throw new Error(
        'Invalid FCM payload: one of tokens and topic has to be provided and they cannot be used together',
      );
    }

    const message: Message | MulticastMessage = {
      ...(!multicast && tokens?.length && { token: tokens[0] }),
      ...(multicast && tokens?.length && { tokens }),
      ...(topic && { topic }),
      ...(clientAutoNotification && {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
      }),
      data: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
        ...data,
      },
      android: {
        priority: priority as 'normal' | 'high',
        ttl: timeToLive * 1000,
      },
      apns: {
        headers: {
          'apns-priority': priority === NotificationPriorityEnum.HIGH ? '10' : '5',
          'apns-expiration': `${Math.floor(Date.now() / 1000) + timeToLive}`,
        },
      },
      webpush: {
        headers: {
          Urgency: priority,
          ttl: timeToLive.toString(),
        },
      },
    };

    return message;
  }

  private isFCMTopicPayload(payload: FCMTokenPayload | FCMTopicPayload): payload is FCMTopicPayload {
    return !!(payload as FCMTopicPayload).topic;
  }

  private isFCMTokenPayload(payload: FCMTokenPayload | FCMTopicPayload): payload is FCMTokenPayload {
    return !!(payload as FCMTokenPayload).tokens;
  }
}
