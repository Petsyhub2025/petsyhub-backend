import {
  AppointmentAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { AppointmentsRpcHandlerService } from './handler.service';

@Injectable()
export class AppointmentsRpcReceiverService {
  constructor(private readonly appointmentsRpcHandlerService: AppointmentsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_CLINIC_APPOINTMENTS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_CLINIC_APPOINTMENTS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getAdminsSearchData(data: AppointmentAdminRpcPayload) {
    return this.appointmentsRpcHandlerService.getAppointmentsSearchData(data);
  }
}
