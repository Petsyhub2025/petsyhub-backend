import { ProviderIdParamDto } from '@serviceproviders/admin/shared/dto/provider-id-param.dto';
import { Controller, Get, Param, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BasePaginationQuery,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { ServiceProvidersService } from './service-providers.service';

@Controller({ path: 'serviceproviders', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class ServiceProvidersController {
  constructor(private readonly serviceProvidersService: ServiceProvidersService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.SERVICE_PROVIDERS, operation: AdminResourceOperationsEnum.READ })
  async getServiceProviders(@Persona() adminJWT: AdminJwtPersona, @Query() query: BasePaginationQuery) {
    const serviceProviders = await this.serviceProvidersService.getServiceProviders(adminJWT._id, query);
    return new CustomResponse().success({
      payload: serviceProviders,
    });
  }

  @Get(':providerId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.SERVICE_PROVIDERS, operation: AdminResourceOperationsEnum.READ })
  async getServiceProviderById(@Persona() adminJWT: AdminJwtPersona, @Param() param: ProviderIdParamDto) {
    const serviceProvider = await this.serviceProvidersService.getServiceProviderById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: serviceProvider,
      },
    });
  }
}
