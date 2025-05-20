import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  addPaginationStages,
  AppointmentEventsEnum,
  AppointmentStatusEnum,
  IBaseAppointmentModel,
  ModelNames,
} from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentStatusValidator } from '@appointments/shared/helpers/appointment-status.helper';
import { AppointmentsStatusEnumDto, GetAppointmentsDto } from './dto/get-appointments.dto';
import { AppointmentIdParamDto } from '@appointments/shared/dto/appointmnet-id-param.dto';
import { errorManager } from '@appointments/shared/config/errors.config';
import { appointmentsPipeline } from './aggregations/appointments.aggregation';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(ModelNames.BASE_APPOINTMENT) private baseAppointmentModel: IBaseAppointmentModel,
    private appointmentStatusValidator: AppointmentStatusValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  applyAppointmentsStatus(status: AppointmentsStatusEnumDto) {
    switch (status) {
      case AppointmentsStatusEnumDto.PENDING:
        return [AppointmentStatusEnum.PENDING];
      case AppointmentsStatusEnumDto.UPCOMING:
        return [AppointmentStatusEnum.PENDING, AppointmentStatusEnum.CONFIRMED];
      case AppointmentsStatusEnumDto.HISTORY:
        return [AppointmentStatusEnum.CANCELLED, AppointmentStatusEnum.REJECTED, AppointmentStatusEnum.COMPLETED];
      default:
        return [AppointmentStatusEnum.PENDING];
    }
  }
  async getAppointments(
    serviceProviderId: string | Types.ObjectId,
    { limit, page, status, petTypes, services, date, branch, medicalSpecialties }: GetAppointmentsDto,
  ) {
    const statusFilter = this.applyAppointmentsStatus(status);

    const matchStage = [
      {
        $match: {
          branch: new Types.ObjectId(branch),
          ...(petTypes?.length && {
            selectedPetType: { $in: petTypes.map((branch: any) => new Types.ObjectId(branch._id)) },
          }),
          ...(status && { status: { $in: statusFilter } }),
          ...(date && {
            $expr: {
              $eq: [
                new Date(date).toISOString().slice(0, 10),
                { $dateToString: { date: '$date', format: '%Y-%m-%d' } },
              ],
            },
          }),
          ...(services?.length && {
            selectedServices: { $all: services.map((serviceId) => new Types.ObjectId(serviceId)) },
          }),
          ...(medicalSpecialties?.length && {
            medicalSpecialties: {
              $all: medicalSpecialties.map((medicalSpecialty) => new Types.ObjectId(medicalSpecialty)),
            },
          }),
        },
      },
    ];

    // eslint-disable-next-line prefer-const
    let [[{ total = 0 } = {}], docs] = await Promise.all([
      this.baseAppointmentModel.aggregate(matchStage).count('total'),
      this.baseAppointmentModel.aggregate([
        ...matchStage,
        ...([{ $sort: { createdAt: -1 } }] as PipelineStage[]),
        ...addPaginationStages({ limit, page }),
        ...appointmentsPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async acceptAppointment(serviceProviderId: string | Types.ObjectId, { appointmentId }: AppointmentIdParamDto) {
    const appointment = await this.baseAppointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException(errorManager.APPOINTMENT_NOT_FOUND);

    this.appointmentStatusValidator.isStatusValidForAppointment(appointment, AppointmentStatusEnum.CONFIRMED);

    appointment.status = AppointmentStatusEnum.CONFIRMED;
    await appointment.save();

    this.eventEmitter.emit(AppointmentEventsEnum.SEND_APPOINTMENT_CONFIRMATION_NOTIFICATION, appointment);
  }

  async rejectAppointment(serviceProviderId: string | Types.ObjectId, { appointmentId }: AppointmentIdParamDto) {
    const appointment = await this.baseAppointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException(errorManager.APPOINTMENT_NOT_FOUND);

    this.appointmentStatusValidator.isStatusValidForAppointment(appointment, AppointmentStatusEnum.REJECTED);

    appointment.status = AppointmentStatusEnum.REJECTED;
    await appointment.save();

    this.eventEmitter.emit(AppointmentEventsEnum.SEND_APPOINTMENT_REJECTION_NOTIFICATION, appointment);
  }

  async completeAppointment(serviceProviderId: string | Types.ObjectId, { appointmentId }: AppointmentIdParamDto) {
    const appointment = await this.baseAppointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException(errorManager.APPOINTMENT_NOT_FOUND);

    this.appointmentStatusValidator.isStatusValidForAppointment(appointment, AppointmentStatusEnum.COMPLETED);

    appointment.status = AppointmentStatusEnum.COMPLETED;
    await appointment.save();
  }

  // async getUpcomingAppointments(
  //   serviceProviderId: string | Types.ObjectId,
  //   { clinicBranches }: GetUpcomingAppointmentsDto,
  // ) {
  //   const [serviceProvider] = await this.clinicServiceProviderModel.aggregate([
  //     {
  //       $match: { _id: new Types.ObjectId(serviceProviderId) },
  //     },
  //     ...serviceProviderBranchesPipeline(clinicBranches),
  //   ]);
  //   if (!serviceProvider) throw new NotFoundException(errorManager.SERVICE_PROVIDER_NOT_FOUND);

  //   if (!serviceProvider.branches?.length) return [];

  //   const matchStage = [
  //     {
  //       $match: {
  //         branch: {
  //           $in: serviceProvider.branches.map((branch: any) => new Types.ObjectId(branch._id)),
  //         },
  //         status: { $in: [AppointmentStatusEnum.PENDING, AppointmentStatusEnum.CONFIRMED] },
  //       },
  //     },
  //   ];

  //   const [docs] = await Promise.all([
  //     this.baseAppointmentModel.aggregate([
  //       ...matchStage,
  //       {
  //         $group: {
  //           _id: '$date',
  //           count: {
  //             $sum: 1,
  //           },
  //         },
  //       },
  //       {
  //         $sort: {
  //           _id: 1,
  //         },
  //       },
  //       { $limit: 5 },
  //       { $addFields: { date: '$_id' } },
  //       {
  //         $project: {
  //           date: 1,
  //           _id: 0,
  //           count: 1,
  //         },
  //       },
  //     ]),
  //   ]);

  //   return docs;
  // }

  // async getUpcomingAppointmentsList(
  //   serviceProviderId: string | Types.ObjectId,
  //   { limit, page, date, clinicBranches }: GetUpcomingAppointmentsListDto,
  // ) {
  //   const [serviceProvider] = await this.clinicServiceProviderModel.aggregate([
  //     {
  //       $match: { _id: new Types.ObjectId(serviceProviderId) },
  //     },
  //     ...serviceProviderBranchesPipeline(clinicBranches),
  //   ]);
  //   if (!serviceProvider) throw new NotFoundException(errorManager.SERVICE_PROVIDER_NOT_FOUND);

  //   if (!serviceProvider.branches?.length) return { data: [], total: 0, limit, page, pages: 0 };

  //   const matchStage = [
  //     {
  //       $match: {
  //         branch: {
  //           $in: serviceProvider.branches.map((branch: any) => new Types.ObjectId(branch._id)),
  //         },
  //         status: { $in: [AppointmentStatusEnum.PENDING, AppointmentStatusEnum.CONFIRMED] },
  //         $expr: {
  //           $eq: [new Date(date).toISOString().slice(0, 10), { $dateToString: { format: '%Y-%m-%d', date: '$date' } }],
  //         },
  //       },
  //     },
  //   ];

  //   // eslint-disable-next-line prefer-const
  //   let [[{ total = 0 } = {}], docs] = await Promise.all([
  //     this.baseAppointmentModel.aggregate(matchStage).count('total'),
  //     this.baseAppointmentModel.aggregate([
  //       ...matchStage,
  //       ...([{ $sort: { createdAt: -1 } }] as PipelineStage[]),
  //       ...addPaginationStages({ limit, page }),
  //       ...appointmentsPipeline(),
  //     ]),
  //   ]);

  //   docs = await this.populateAppointmentsServiceTypes(docs);

  //   return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  // }

  // async getMonthlyAppointmentsCharts(serviceProviderId: string | Types.ObjectId) {
  //   const [serviceProvider] = await this.clinicServiceProviderModel.aggregate([
  //     {
  //       $match: { _id: new Types.ObjectId(serviceProviderId) },
  //     },
  //     ...serviceProviderBranchesPipeline(),
  //   ]);
  //   if (!serviceProvider) throw new NotFoundException(errorManager.SERVICE_PROVIDER_NOT_FOUND);

  //   if (!serviceProvider.branches?.length) if (!serviceProvider.branches?.length) return [];

  //   const matchStage = [
  //     {
  //       $match: {
  //         branch: {
  //           $in: serviceProvider.branches.map((branch: any) => new Types.ObjectId(branch._id)),
  //         },
  //         status: AppointmentStatusEnum.COMPLETED,
  //       },
  //     },
  //   ];

  //   const [docs] = await Promise.all([
  //     this.baseAppointmentModel.aggregate([
  //       ...matchStage,
  //       {
  //         $group: {
  //           _id: {
  //             month: { $month: '$date' },
  //           },
  //           count: {
  //             $sum: 1,
  //           },
  //         },
  //       },
  //       {
  //         $sort: {
  //           '_id.month': 1,
  //         },
  //       },
  //       { $limit: 12 },
  //       { $addFields: { month: '$_id.month' } },
  //       {
  //         $project: {
  //           month: 1,
  //           _id: 0,
  //           count: 1,
  //         },
  //       },
  //     ]),
  //   ]);

  //   return docs;
  // }

  async getAppointmentDetails(serviceProviderId: string | Types.ObjectId, { appointmentId }: AppointmentIdParamDto) {
    const appointment = await this._getAppointmentById(appointmentId);
    if (!appointment) throw new NotFoundException(errorManager.APPOINTMENT_NOT_FOUND);

    return appointment;
  }

  private async _getAppointmentById(appointmentId: string | Types.ObjectId) {
    const [doc] = await this.baseAppointmentModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(appointmentId) },
      },
      ...appointmentsPipeline(),
    ]);

    return doc;
  }
}
