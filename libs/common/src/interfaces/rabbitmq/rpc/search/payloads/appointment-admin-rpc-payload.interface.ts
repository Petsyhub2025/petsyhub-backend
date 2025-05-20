import { BaseSearchPaginationQuery } from '@common/dtos';
import { AppointmentStatusEnum } from '@common/schemas/mongoose/appointment/base-appointment.enum';

export class AppointmentAdminRpcPayload extends BaseSearchPaginationQuery {
  areaId?: string;
  branchId?: string;
  cityId?: string;
  countryId?: string;
  status?: AppointmentStatusEnum;
  dateFrom?: string;
  dateTo?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
}
