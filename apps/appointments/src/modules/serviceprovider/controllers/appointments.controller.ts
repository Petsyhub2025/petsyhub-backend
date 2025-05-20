import { Controller, Get, Param, Patch, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  BranchAccessResourceOperationsEnum,
  BranchAccessResourcesEnum,
  CustomResponse,
  Persona,
  ServiceProviderJwtPersona,
  ServiceProviderPermission,
} from '@instapets-backend/common';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { AppointmentIdParamDto } from '@appointments/shared/dto/appointmnet-id-param.dto';
import { BranchIdQueryDto } from '@appointments/shared/dto/branch-id-query.dto';

@Controller({ path: 'appointments', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  @ApiBearerAuth()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.APPOINTMENTS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getAppointments(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Query() getAppointmentsDto: GetAppointmentsDto,
  ) {
    return new CustomResponse().success({
      payload: await this.appointmentsService.getAppointments(serviceProviderJwtPersona._id, getAppointmentsDto),
    });
  }

  @Get(':appointmentId')
  @ApiBearerAuth()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.APPOINTMENTS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getAppointmentDetails(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Param() appointmentIdParamDto: AppointmentIdParamDto,
    @Query() branchIdQueryDto: BranchIdQueryDto,
  ) {
    return new CustomResponse().success({
      payload: {
        data: await this.appointmentsService.getAppointmentDetails(
          serviceProviderJwtPersona._id,
          appointmentIdParamDto,
        ),
      },
    });
  }

  @Patch(':appointmentId/accept')
  @ApiBearerAuth()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.APPOINTMENTS,
    operation: BranchAccessResourceOperationsEnum.UPDATE,
  })
  async acceptAppointment(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Param() appointmentIdParamDto: AppointmentIdParamDto,
    @Query() branchIdQueryDto: BranchIdQueryDto,
  ) {
    await this.appointmentsService.acceptAppointment(serviceProviderJwtPersona._id, appointmentIdParamDto);
    return new CustomResponse().success({});
  }

  @Patch(':appointmentId/reject')
  @ApiBearerAuth()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.APPOINTMENTS,
    operation: BranchAccessResourceOperationsEnum.UPDATE,
  })
  async rejectAppointment(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Param() appointmentIdParamDto: AppointmentIdParamDto,
    @Query() branchIdQueryDto: BranchIdQueryDto,
  ) {
    await this.appointmentsService.rejectAppointment(serviceProviderJwtPersona._id, appointmentIdParamDto);
    return new CustomResponse().success({});
  }

  @Patch(':appointmentId/complete')
  @ApiBearerAuth()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.APPOINTMENTS,
    operation: BranchAccessResourceOperationsEnum.UPDATE,
  })
  async completeAppointment(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Param() appointmentIdParamDto: AppointmentIdParamDto,
    @Query() branchIdQueryDto: BranchIdQueryDto,
  ) {
    await this.appointmentsService.completeAppointment(serviceProviderJwtPersona._id, appointmentIdParamDto);
    return new CustomResponse().success({});
  }
}
