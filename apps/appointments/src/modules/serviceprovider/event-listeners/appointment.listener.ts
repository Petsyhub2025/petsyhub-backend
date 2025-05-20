import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  BaseAppointment,
  AppointmentEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
  IPetModel,
  IBaseAppointmentModel,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class ServiceProviderAppointmentEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.BASE_APPOINTMENT) private appointmentModel: IBaseAppointmentModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(AppointmentEventsEnum.SEND_APPOINTMENT_CONFIRMATION_NOTIFICATION, { promisify: true })
  async handleAppointmentConfirmationNotification(event: HydratedDocument<BaseAppointment>) {
    await this.errorHandler.eventListenerErrorHandler(
      AppointmentEventsEnum.SEND_APPOINTMENT_CONFIRMATION_NOTIFICATION,
      this.sendAppointmentConfirmationNotification.bind(this, event),
    );
  }

  @OnEvent(AppointmentEventsEnum.SEND_APPOINTMENT_REJECTION_NOTIFICATION, { promisify: true })
  async handleAppointmentRejectionNotification(event: HydratedDocument<BaseAppointment>) {
    await this.errorHandler.eventListenerErrorHandler(
      AppointmentEventsEnum.SEND_APPOINTMENT_REJECTION_NOTIFICATION,
      this.sendAppointmentRejectionNotification.bind(this, event),
    );
  }

  private async sendAppointmentConfirmationNotification(doc: HydratedDocument<BaseAppointment>) {
    const [user, appointment] = await Promise.all([
      this.userModel.findById(doc.user),
      this.appointmentModel.findById(doc._id),
    ]);
    const pet = await this.petModel.findById(appointment.selectedPet);

    if (!user || !appointment) {
      throw new Error('Invalid Appointment document');
    }

    const receiverId = user._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: appointment._id.toString(),
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
    });

    const title = {
      en: 'Appointment confirmation',
      ar: 'تأكيد الموعد',
    };
    const body = {
      en: `Great News! your upcoming vet appointment for a ${
        pet.name
      } on ${appointment.date.toDateString()} is confirmed make sure to have them ready for their checkup`,
      ar: `أخبار رائعة! تم تأكيد موعدك القادم مع الطبيب البيطري لحيوانك الأليف وتأكد من تجهيزه للفحص`,
    };

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.APPOINTMENT,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: appointment.dynamicLink,
      notificationType: UserNotificationTypeEnum.APPOINTMENT,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private async sendAppointmentRejectionNotification(doc: HydratedDocument<BaseAppointment>) {
    const [user, appointment] = await Promise.all([
      this.userModel.findById(doc.user),
      this.appointmentModel.findById(doc._id),
    ]);
    const pet = await this.petModel.findById(appointment.selectedPet);

    if (!user || !appointment) {
      throw new Error('Invalid Appointment document');
    }

    const receiverId = user._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: appointment._id.toString(),
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
    });

    const title = {
      en: 'Rejected appointment',
      ar: 'تم رفض الموعد',
    };
    const body = {
      en: `We are sorry to inform you that your appointment request for a ${
        pet.name
      } scheduled for ${appointment.date.toDateString()} has been rejected due to unforeseen circumstances. We apologize for any inconvenience this may cause.`,
      ar: `نأسف لإبلاغك بأن طلب تحديد موعد لحيوانك الأليف قد تم رفضه بسبب ظروف غير متوقعة. نحن نعتذر عن أي إزعاج قد يسببه هذا الأمر.`,
    };

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.APPOINTMENT,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: appointment.dynamicLink,
      notificationType: UserNotificationTypeEnum.APPOINTMENT,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }
}
