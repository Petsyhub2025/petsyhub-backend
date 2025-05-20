import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BasePaginationQuery, CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { globalControllerVersioning } from '@appointments/shared/constants';
import { AppointmentIdParamDto } from '@appointments/shared/dto/appointmnet-id-param.dto';

@Controller({ path: 'appointments', ...globalControllerVersioning })
@ApiTags('user')
export class AppointmentsController {
  constructor(private readonly appointmentService: AppointmentsService) {}

  @ApiBearerAuth()
  @Post()
  async createAppointment(@Persona() userProviderJwt: UserJwtPersona, @Body() body: CreateAppointmentDto) {
    await this.appointmentService.createAppointment(userProviderJwt._id, body);
    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get('upcomming')
  async getUpcomingAppointments(@Persona() userProviderJwt: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const upcomingAppointments = await this.appointmentService.getUpcomingAppointments(userProviderJwt._id, query);

    return new CustomResponse().success({
      payload: upcomingAppointments,
    });
  }

  @ApiBearerAuth()
  @Get('history')
  async getHistoryAppointments(@Persona() userProviderJwt: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const historyAppointments = await this.appointmentService.getHistoryAppointments(userProviderJwt._id, query);

    return new CustomResponse().success({
      payload: historyAppointments,
    });
  }

  @ApiBearerAuth()
  @Get('upcomming/counts')
  async getUpcomingAppointmentsCount(@Persona() userProviderJwt: UserJwtPersona) {
    const upcomingAppointmentsCount = await this.appointmentService.getUpcomingAppointmentsCount(userProviderJwt._id);

    return new CustomResponse().success({
      payload: { data: upcomingAppointmentsCount },
    });
  }

  @ApiBearerAuth()
  @Patch(':appointmentId/cancel')
  async cancelAppointment(@Persona() userProviderJwt: UserJwtPersona, @Param() param: AppointmentIdParamDto) {
    await this.appointmentService.cancelAppointment(userProviderJwt._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get(':appointmentId/details')
  async getAppointmentDetails(@Persona() userProviderJwt: UserJwtPersona, @Param() param: AppointmentIdParamDto) {
    const appointment = await this.appointmentService.getAppointmentDetails(userProviderJwt._id, param);

    return new CustomResponse().success({
      payload: { data: appointment },
    });
  }
}
