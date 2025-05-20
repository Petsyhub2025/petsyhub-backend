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
  IBaseAppointmentModel,
  IPetModel,
  ISendAdminNotificationEvent,
  AdminFcmTopicsEnum,
  AdminNotificationTypeEnum,
  RabbitExchanges,
  RabbitRoutingKeys,
  ClinicBranch,
  Pet,
  User,
  ISendServiceProviderNotificationEvent,
  ServiceProviderNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument, Types } from 'mongoose';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class UserAppointmentEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.BASE_APPOINTMENT) private baseAppointmentModel: IBaseAppointmentModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @OnEvent(AppointmentEventsEnum.SEND_APPOINTMENT_CREATION_NOTIFICATION, { promisify: true })
  async handleAppointmentCreationNotification(event: HydratedDocument<BaseAppointment>) {
    await this.errorHandler.eventListenerErrorHandler(
      AppointmentEventsEnum.SEND_APPOINTMENT_CREATION_NOTIFICATION,
      this.sendAppointmentCreationNotification.bind(this, event),
    );
  }

  @OnEvent(AppointmentEventsEnum.SEND_APPOINTMENT_CANCELLATION_NOTIFICATION, { promisify: true })
  async handleAppointmentCancellationNotification(event: HydratedDocument<BaseAppointment>) {
    await this.errorHandler.eventListenerErrorHandler(
      AppointmentEventsEnum.SEND_APPOINTMENT_CANCELLATION_NOTIFICATION,
      this.sendAppointmentCancellationNotification.bind(this, event),
    );
  }

  private async sendAppointmentCreationNotification(doc: HydratedDocument<BaseAppointment>) {
    const user = await this.userModel.findById(doc.user);
    const [appointment] = await this.baseAppointmentModel.aggregate<
      Hydrate<BaseAppointment & { branch: ClinicBranch; selectedPet: Pet }>
    >([
      {
        $match: {
          _id: new Types.ObjectId(doc._id),
        },
      },
      {
        $lookup: {
          from: 'basebranches',
          let: { branchId: '$branch' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$branchId'],
                },
              },
            },
            {
              $lookup: {
                from: 'brands',
                let: { brandId: '$brand' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$brandId'],
                      },
                    },
                  },
                ],
                as: 'brand',
              },
            },
            {
              $unwind: {
                path: '$brand',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                brand: 1,
              },
            },
          ],
          as: 'branch',
        },
      },
      {
        $unwind: { path: '$branch', preserveNullAndEmptyArrays: false },
      },
      {
        $lookup: {
          from: 'pets',
          let: { selectedPetId: '$selectedPet' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$selectedPetId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
          as: 'selectedPet',
        },
      },
      {
        $unwind: { path: '$selectedPet', preserveNullAndEmptyArrays: false },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          selectedPet: 1,
          branch: 1,
          dynamicLink: 1,
          user: 1,
        },
      },
    ]);

    if (!user || !appointment) {
      throw new Error('Invalid BaseAppointment document');
    }

    await Promise.all([
      this.sendAdminAppointmentCreationNotification(appointment),
      this.sendUserAppointmentCreationNotification(user, appointment),
      this.sendClinicAppointmentCreationNotification(user, appointment),
    ]);
  }

  private async sendAdminAppointmentCreationNotification(
    appointment: HydratedDocument<BaseAppointment & { branch: ClinicBranch; selectedPet: Pet }>,
  ) {
    const adminNotificationDeepLink = this.deepLinkService.generateAdminDeepLink({
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
      modelId: appointment._id.toString(),
    });

    const adminNotification: ISendAdminNotificationEvent = {
      title: 'New BaseAppointment! 🎉',
      body: `A new appointment ${appointment._id} at ${appointment.branch.name} has been created`,
      topic: AdminFcmTopicsEnum.APPOINTMENTS,
      notificationType: AdminNotificationTypeEnum.NEW_APPOINTMENT,
      deepLink: adminNotificationDeepLink,
    };

    await this.amqpConnection.publish(
      RabbitExchanges.SERVICE,
      RabbitRoutingKeys.NOTIFICATION_EVENTS_ADMIN_SEND_NOTIFICATION,
      adminNotification,
    );
  }

  private async sendUserAppointmentCreationNotification(
    user: HydratedDocument<User>,
    appointment: HydratedDocument<BaseAppointment & { branch: ClinicBranch; selectedPet: Pet }>,
  ) {
    const receiverId = user._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: appointment._id.toString(),
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
    });

    const title = {
      en: 'BaseAppointment request received',
      ar: 'تم انشاء الميعاد',
    };
    const body = {
      en: `Hi there! we've received your appointment request for a ${appointment.selectedPet.name} Our clinic will review it shortly, and you will receive a confirmation once it's accepted. thanks for choosing us for your pet's care`,
      ar: `أهلاً! لقد تلقينا طلب تحديد موعد لحيوانك الأليف وستقوم عيادتنا بمراجعته قريبًا، وستتلقى تأكيدًا بمجرد قبوله. شكرًا لاختيارك لنا لرعاية حيوانك الأليف`,
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
  private async sendClinicAppointmentCreationNotification(
    user: HydratedDocument<User>,
    appointment: HydratedDocument<BaseAppointment & { branch: ClinicBranch; selectedPet: Pet }>,
  ) {
    const clinicNotificationDeepLink = this.deepLinkService.generateServiceProviderDeepLink({
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
      modelId: appointment._id.toString(),
    });

    const serviceProviderNotification: ISendServiceProviderNotificationEvent = {
      title: {
        en: `${user.firstName} ${user.lastName} Booked an BaseAppointment at ${appointment.branch.name}`,
        ar: `${user.firstName} ${user.lastName} قام بالحجز في فرع ${appointment.branch.name}`,
      },
      body: {
        en: `${user.firstName} ${user.lastName} Booked an BaseAppointment at ${appointment.branch.name}`,
        ar: `${user.firstName} ${user.lastName} قام بالحجز في فرع ${appointment.branch.name}`,
      },
      notificationType: ServiceProviderNotificationTypeEnum.NEW_APPOINTMENT,
      deepLink: clinicNotificationDeepLink,
      receiverServiceProviderId: appointment.branch.brand._id.toString(),
      imageMedia: user?.profilePictureMedia,
    };

    await this.amqpConnection.publish(
      RabbitExchanges.SERVICE,
      RabbitRoutingKeys.NOTIFICATION_EVENTS_SERVICE_PROVIDER_SEND_NOTIFICATION,
      serviceProviderNotification,
    );
  }

  private async sendAppointmentCancellationNotification(doc: HydratedDocument<BaseAppointment>) {
    const user = await this.userModel.findById(doc.user);
    const [appointment] = await this.baseAppointmentModel.aggregate<
      Hydrate<BaseAppointment & { branch: ClinicBranch; selectedPet: Pet }>
    >([
      {
        $match: {
          _id: new Types.ObjectId(doc._id),
        },
      },
      {
        $lookup: {
          from: 'basebranches',
          let: { branchId: '$branch' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$branchId'],
                },
              },
            },
            {
              $lookup: {
                from: 'brands',
                let: { brandId: '$brand' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$brandId'],
                      },
                    },
                  },
                ],
                as: 'brand',
              },
            },
            {
              $unwind: {
                path: '$brand',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                brand: 1,
              },
            },
          ],
          as: 'branch',
        },
      },
      {
        $unwind: { path: '$branch', preserveNullAndEmptyArrays: false },
      },
      {
        $lookup: {
          from: 'pets',
          let: { selectedPetId: '$selectedPet' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$selectedPetId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
          as: 'selectedPet',
        },
      },
      {
        $unwind: { path: '$selectedPet', preserveNullAndEmptyArrays: false },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          selectedPet: 1,
          branch: 1,
          dynamicLink: 1,
          user: 1,
          date: 1,
        },
      },
    ]);

    if (!user || !appointment) {
      throw new Error('Invalid BaseAppointment document');
    }

    await Promise.all([
      this.sendUserAppointmentCancellationNotification(user, appointment),
      this.sendClinicAppointmentCancellationNotification(user, appointment),
    ]);
  }
  private async sendUserAppointmentCancellationNotification(
    user: HydratedDocument<User>,
    appointment: HydratedDocument<BaseAppointment & { branch: ClinicBranch; selectedPet: Pet }>,
  ) {
    const receiverId = user._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: appointment._id.toString(),
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
    });

    const title = {
      en: 'Canceled appointment',
      ar: 'تم إلغاء الموعد',
    };
    const body = {
      en: `the vet appointment for a ${
        appointment.selectedPet.name
      } on ${appointment.date.toDateString()} has been canceled`,
      ar: `تم إلغاء موعد الطبيب البيطري لحيوانك الأليف في الموعد المحدد`,
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
  private async sendClinicAppointmentCancellationNotification(
    user: HydratedDocument<User>,
    appointment: HydratedDocument<BaseAppointment & { branch: ClinicBranch; selectedPet: Pet }>,
  ) {
    const clinicNotificationDeepLink = this.deepLinkService.generateServiceProviderDeepLink({
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
      modelId: appointment._id.toString(),
    });

    const serviceProviderNotification: ISendServiceProviderNotificationEvent = {
      title: {
        en: `${user.firstName} ${user.lastName} Cancelled an BaseAppointment at ${appointment.branch.name}`,
        ar: `${user.firstName} ${user.lastName} قام بالغاء الحجز`,
      },
      body: {
        en: `${user.firstName} ${user.lastName} Cancelled an BaseAppointment at ${appointment.branch.name}`,
        ar: `${user.firstName} ${user.lastName} قام بالغاء الحجز `,
      },
      notificationType: ServiceProviderNotificationTypeEnum.CANCEL_APPOINTMENT,
      deepLink: clinicNotificationDeepLink,
      receiverServiceProviderId: appointment.branch.brand._id.toString(),
      imageMedia: user?.profilePictureMedia,
    };

    await this.amqpConnection.publish(
      RabbitExchanges.SERVICE,
      RabbitRoutingKeys.NOTIFICATION_EVENTS_SERVICE_PROVIDER_SEND_NOTIFICATION,
      serviceProviderNotification,
    );
  }
}
