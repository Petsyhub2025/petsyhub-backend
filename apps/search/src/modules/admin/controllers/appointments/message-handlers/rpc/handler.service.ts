import {
  AppointmentAdminRpcPayload,
  AppointmentsEsFieldsEnum,
  AppointmentsEsSaytFieldsEnum,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';

@Injectable()
export class AppointmentsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getAppointmentsSearchData({
    page,
    limit,
    search,
    areaId,
    branchId,
    cityId,
    countryId,
    status,
    dateFrom,
    dateTo,
    scheduledDateFrom,
    scheduledDateTo,
  }: AppointmentAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.APPOINTMENT,
        filters: [
          ...(branchId
            ? [
                {
                  term: {
                    branch: branchId,
                  },
                },
              ]
            : []),
          ...(cityId
            ? [
                {
                  term: {
                    city: cityId,
                  },
                },
              ]
            : []),
          ...(countryId
            ? [
                {
                  term: {
                    country: countryId,
                  },
                },
              ]
            : []),
          ...(status
            ? [
                {
                  term: {
                    status: status,
                  },
                },
              ]
            : []),
          ...(areaId
            ? [
                {
                  term: {
                    area: areaId,
                  },
                },
              ]
            : []),
          ...(dateFrom || dateTo
            ? [
                {
                  range: {
                    createdAt: {
                      ...(dateFrom && { gte: dateFrom }),
                      ...(dateTo && { lte: dateTo }),
                    },
                  },
                },
              ]
            : []),
          ...(scheduledDateFrom || scheduledDateTo
            ? [
                {
                  range: {
                    date: {
                      ...(scheduledDateFrom && { gte: scheduledDateFrom }),
                      ...(scheduledDateTo && { lte: scheduledDateTo }),
                    },
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [`${AppointmentsEsFieldsEnum.UserFullName}^2`, AppointmentsEsFieldsEnum.UserUsername],
        saytFields: [`${AppointmentsEsSaytFieldsEnum.UserFullName}^2`, AppointmentsEsSaytFieldsEnum.UserUsername],
        page,
        limit,
        accurateCount: true,
      });

      const total = searches?.total;
      const totalValue = typeof total === 'number' ? total : total?.value || 0;
      const _ids = searches?.hits ? searches.hits.map((value) => value._id) : [];

      return RpcResponse.success({
        _ids,
        limit,
        page,
        total: totalValue,
        pages: Math.ceil(totalValue / limit),
      });
    }
  }
}
