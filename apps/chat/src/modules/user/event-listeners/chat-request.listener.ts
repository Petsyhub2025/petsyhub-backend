import {
  ChatRequestEventsEnum,
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';

interface IChatRequest {
  userId: string;
  recipientId: Types.ObjectId;
}

@Injectable()
export class ChatRequestEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  @OnEvent(ChatRequestEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: IChatRequest) {
    await this.errorHandler.eventListenerErrorHandler(
      ChatRequestEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: IChatRequest) {
    if (!this.isChatRequest(doc)) {
      throw new Error('Invalid ChatRequest document');
    }

    const [receiver, requester] = await Promise.all([
      this.userModel.findById(doc.recipientId),
      this.userModel.findById(doc.userId),
    ]);

    if (!receiver || !requester) {
      throw new Error('Invalid ChatRequest document');
    }

    const receiverId = receiver._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: requester._id.toString(),
      modelName: DeepLinkModelsEnum.USERS,
      queryParams: {
        authorUser: requester._id.toString(),
      },
    });
    const title = {
      en: 'Chat Request ➕',
      ar: 'طلب دردشة ➕',
    };
    const body = {
      en: `@author has requested to chat with you`,
      ar: `@author طلب الدردشة معك`,
    };

    if (requester._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.CHAT_REQUEST,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: requester.dynamicLink,
      notificationType: UserNotificationTypeEnum.CHAT_REQUEST,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isChatRequest(doc: IChatRequest): doc is IChatRequest {
    return !!(doc?.userId && doc?.recipientId);
  }
}
