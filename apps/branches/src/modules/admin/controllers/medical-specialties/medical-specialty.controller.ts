import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BaseSearchPaginationQuery,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { MedicalSpecialtyService } from './medical-specialty.service';
import { CreateMedicalSpecialtyDto } from './dto/create-medical-specialty-type.dto';
import { UpdateMedicalSpecialtyDto } from './dto/update-medical-specialty-type.dto';
import { MedicalSpecialtyIdParamDto } from '@branches/admin/shared/dto/medical-specialty-id-param.dto';

@Controller({ path: 'medical-specialties', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class MedicalSpecialtyController {
  constructor(private readonly medicalSpecialtyService: MedicalSpecialtyService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MEDICAL_SPECIALTY, operation: AdminResourceOperationsEnum.CREATE })
  async createMedicalSpecialty(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateMedicalSpecialtyDto) {
    const medicalSpecialty = await this.medicalSpecialtyService.createMedicalSpecialty(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: medicalSpecialty },
    });
  }

  @Patch(':medicalSpecialtyId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MEDICAL_SPECIALTY, operation: AdminResourceOperationsEnum.UPDATE })
  async updateMedicalSpecialty(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: MedicalSpecialtyIdParamDto,
    @Body() body: UpdateMedicalSpecialtyDto,
  ) {
    const medicalSpecialty = await this.medicalSpecialtyService.updateMedicalSpecialty(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: medicalSpecialty },
    });
  }

  @Delete(':medicalSpecialtyId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MEDICAL_SPECIALTY, operation: AdminResourceOperationsEnum.DELETE })
  async deleteMedicalSpecialty(@Persona() adminJWT: AdminJwtPersona, @Param() params: MedicalSpecialtyIdParamDto) {
    await this.medicalSpecialtyService.deleteMedicalSpecialty(adminJWT._id, params);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MEDICAL_SPECIALTY, operation: AdminResourceOperationsEnum.READ })
  async getMedicalSpecialty(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const medicalSpecialties = await this.medicalSpecialtyService.getMedicalSpecialties(adminJWT._id, query);
    return new CustomResponse().success({
      payload: medicalSpecialties,
    });
  }

  @Get(':medicalSpecialtyId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.MEDICAL_SPECIALTY, operation: AdminResourceOperationsEnum.READ })
  async getMedicalSpecialtyById(@Persona() adminJWT: AdminJwtPersona, @Param() param: MedicalSpecialtyIdParamDto) {
    const medicalSpecialty = await this.medicalSpecialtyService.getMedicalSpecialtyById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: medicalSpecialty,
      },
    });
  }
}
