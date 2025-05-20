import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, NoApiVersion, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { PetTypesService } from './pet-types.service';
import { GetSupportedPetTypesQueryDto } from './dto/get-supported-pet-types.dto';

@Controller({ path: 'pet-types', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class PetTypesController {
  constructor(private readonly petTypesService: PetTypesService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  async getPetTypes(@Persona() serviceProviderPersona: ServiceProviderJwtPersona) {
    const petTypes = await this.petTypesService.getPetTypes(serviceProviderPersona._id);
    return new CustomResponse().success({
      payload: petTypes,
    });
  }

  @Get('supported')
  @ApiBearerAuth()
  @NoApiVersion()
  async getClinicPetTypesList(
    @Persona() serviceProviderPersona: ServiceProviderJwtPersona,
    @Query() query: GetSupportedPetTypesQueryDto,
  ) {
    const petTypes = await this.petTypesService.getBranchPetTypes(serviceProviderPersona._id, query);
    return new CustomResponse().success({
      payload: { data: petTypes },
    });
  }
}
