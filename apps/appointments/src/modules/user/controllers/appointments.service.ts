import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentEventsEnum,
  AppointmentStatusEnum,
  AppointmentTypeEnum,
  BasePaginationQuery,
  IBaseAppointmentModel,
  IBaseBranchModel,
  IPetModel,
  ModelNames,
  addPaginationStages,
} from '@instapets-backend/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Types } from 'mongoose';
import { appointmentPipeline } from './aggregations/appointments.aggregation';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentStatusValidator } from '@appointments/shared/helpers/appointment-status.helper';
import { AppointmentIdParamDto } from '@appointments/shared/dto/appointmnet-id-param.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(ModelNames.BASE_APPOINTMENT) private baseAppointmentModel: IBaseAppointmentModel,
    @Inject(ModelNames.PET) private readonly petModel: IPetModel,
    @Inject(ModelNames.BASE_BRANCH) private baseBranchModel: IBaseBranchModel,
    private appointmentStatusValidator: AppointmentStatusValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createAppointment(userId: string | Types.ObjectId, body: CreateAppointmentDto) {
    const { branchId, date, phoneNumber, selectedPetId, selectedServices, petHealthDescription, medicalSpecialties } =
      body;

    const branch = await this.baseBranchModel.findById(branchId);
    if (!branch) throw new NotFoundException();

    const userSelectedPet = await this.petModel.findOne({
      _id: new Types.ObjectId(selectedPetId),
      'user.userId': new Types.ObjectId(userId),
    });
    if (!userSelectedPet) throw new ConflictException();

    //TODO: Refactor to different type of AppointmentTypeEnum
    const appointment = new this.baseAppointmentModel({
      branch: new Types.ObjectId(branchId),
      selectedPet: new Types.ObjectId(selectedPetId),
      user: new Types.ObjectId(userId),
      selectedPetType: userSelectedPet.type,
      appointmentType: AppointmentTypeEnum.CLINIC,
      phoneNumber,
      date: new Date(date),
      petHealthDescription,
      selectedServices: selectedServices.map((selectedServiceId) => new Types.ObjectId(selectedServiceId)),
      medicalSpecialties: medicalSpecialties.map((medicalSpecialtyId) => new Types.ObjectId(medicalSpecialtyId)),
      country: branch.country,
      city: branch.city,
      area: branch.area,
    });

    await appointment.save();

    this.eventEmitter.emit(AppointmentEventsEnum.SEND_APPOINTMENT_CREATION_NOTIFICATION, appointment);
  }

  private async _getAppointmentById(appointmentId: string | Types.ObjectId) {
    const [appointment] = await this.baseAppointmentModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(appointmentId) },
      },
      ...appointmentPipeline(),
    ]);

    return appointment;
  }

  async getUpcomingAppointments(userId: string | Types.ObjectId, { limit, page }: BasePaginationQuery) {
    const matchStage = [
      {
        $match: {
          user: new Types.ObjectId(userId),
          status: { $in: [AppointmentStatusEnum.CONFIRMED, AppointmentStatusEnum.PENDING] },
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.baseAppointmentModel.aggregate(matchStage).count('total'),
      this.baseAppointmentModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ limit, page }),
        ...appointmentPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getUpcomingAppointmentsCount(userId: string | Types.ObjectId) {
    const matchStage = [
      {
        $match: {
          user: new Types.ObjectId(userId),
          status: { $in: [AppointmentStatusEnum.CONFIRMED, AppointmentStatusEnum.PENDING] },
        },
      },
    ];
    const [{ total = 0 } = {}] = await this.baseAppointmentModel.aggregate(matchStage).count('total');

    return { total };
  }

  async getHistoryAppointments(userId: string | Types.ObjectId, { limit, page }: BasePaginationQuery) {
    const matchStage = [
      {
        $match: {
          user: new Types.ObjectId(userId),
          status: {
            $in: [AppointmentStatusEnum.COMPLETED, AppointmentStatusEnum.CANCELLED, AppointmentStatusEnum.REJECTED],
          },
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.baseAppointmentModel.aggregate(matchStage).count('total'),
      this.baseAppointmentModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ limit, page }),
        ...appointmentPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async cancelAppointment(userId: string | Types.ObjectId, { appointmentId }: AppointmentIdParamDto) {
    const appointment = await this.baseAppointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException();

    if (appointment.user.toString() != userId.toString()) throw new ForbiddenException();

    this.appointmentStatusValidator.isStatusValidForAppointment(appointment, AppointmentStatusEnum.CANCELLED);

    appointment.status = AppointmentStatusEnum.CANCELLED;
    await appointment.save();

    this.eventEmitter.emit(AppointmentEventsEnum.SEND_APPOINTMENT_CANCELLATION_NOTIFICATION, appointment);
  }

  async getAppointmentDetails(userId: string | Types.ObjectId, { appointmentId }: AppointmentIdParamDto) {
    const appointment = await this.baseAppointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException();

    if (appointment.user.toString() != userId.toString()) throw new ForbiddenException();

    return await this._getAppointmentById(appointmentId);
  }
}
