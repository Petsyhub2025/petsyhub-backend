import { TypeIdParamDto } from '@pets/admin/shared/dto/type-id-param.dto';
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
import { CreatePetTypeDto } from './dto/create-pet-type.dto';
import { UpdatePetTypeDto } from './dto/update-pet-type.dto';
import { PetTypesService } from './pet-types.service';

@Controller({ path: 'pet-types', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class PetTypesController {
  constructor(private readonly petTypesService: PetTypesService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_TYPES, operation: AdminResourceOperationsEnum.CREATE })
  async createPetType(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreatePetTypeDto) {
    const petType = await this.petTypesService.createPetType(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: petType },
    });
  }

  @Patch(':typeId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_TYPES, operation: AdminResourceOperationsEnum.UPDATE })
  async updatePetType(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: TypeIdParamDto,
    @Body() body: UpdatePetTypeDto,
  ) {
    const petType = await this.petTypesService.updatePetType(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: petType },
    });
  }

  @Delete(':typeId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_TYPES, operation: AdminResourceOperationsEnum.DELETE })
  async deletePetType(@Persona() adminJWT: AdminJwtPersona, @Param() params: TypeIdParamDto) {
    await this.petTypesService.deletePetType(adminJWT._id, params);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_TYPES, operation: AdminResourceOperationsEnum.READ })
  async getPetTypes(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const petTypes = await this.petTypesService.getPetTypes(adminJWT._id, query);
    return new CustomResponse().success({
      payload: petTypes,
    });
  }

  @Get(':typeId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_TYPES, operation: AdminResourceOperationsEnum.READ })
  async getPetTypeById(@Persona() adminJWT: AdminJwtPersona, @Param() param: TypeIdParamDto) {
    const petType = await this.petTypesService.getPetTypeById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: petType,
      },
    });
  }
}
