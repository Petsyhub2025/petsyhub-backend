import { PetIdParamDto } from '@pets/admin/shared/dto/pet-id-param.dto';
import { Controller, Get, Param, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { GetPetsDto } from './dto/get-pets.dto';
import { PetsService } from './pets.service';

@Controller({ path: 'pets', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PETS, operation: AdminResourceOperationsEnum.READ })
  async getPets(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetPetsDto) {
    const pets = await this.petsService.getPets(adminJWT._id, query);
    return new CustomResponse().success({
      payload: pets,
    });
  }

  @Get(':petId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PETS, operation: AdminResourceOperationsEnum.READ })
  async getPetTypeById(@Persona() adminJWT: AdminJwtPersona, @Param() param: PetIdParamDto) {
    const pet = await this.petsService.getPetById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: pet,
      },
    });
  }
}
