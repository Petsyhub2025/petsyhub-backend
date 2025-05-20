import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, NoApiVersion, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { BranchServiceTypesService } from './branch-service-types.service';

@Controller({ path: 'service-types', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class BranchServiceTypesController {
  constructor(private readonly branchServiceTypesService: BranchServiceTypesService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  async getBranchServiceTypes(@Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona) {
    const branchServiceTypes = await this.branchServiceTypesService.getBranchServiceTypes(
      serviceProviderJwtPersona._id,
    );
    return new CustomResponse().success({
      payload: { data: branchServiceTypes },
    });
  }
}
