import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, NoApiVersion, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { MedicalSpecialtyService } from './medical-specialty.service';

@Controller({ path: 'medical-specialties', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class MedicalSpecialtyController {
  constructor(private readonly medicalSpecialtyService: MedicalSpecialtyService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  async getMedicalSpecialty(@Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona) {
    const medicalSpecialties = await this.medicalSpecialtyService.getMedicalSpecialties(serviceProviderJwtPersona._id);
    return new CustomResponse().success({
      payload: { data: medicalSpecialties },
    });
  }
}
