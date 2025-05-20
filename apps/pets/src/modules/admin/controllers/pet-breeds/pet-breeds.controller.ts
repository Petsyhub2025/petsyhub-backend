import { BreedIdParamDto } from '@pets/admin/shared/dto/breed-id-param.dto';
import { TypeIdParamDto } from '@pets/admin/shared/dto/type-id-param.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
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
import { CreatePetBreedDto } from './dto/create-pet-breed.dto';
import { GetBreedsQueryDto } from './dto/get-pet-breeds.dto';
import { UpdatePetBreedDto } from './dto/update-pet-breed.dto';
import { PetBreedsService } from './pet-breeds.service';

@Controller({ path: 'pet-breeds', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class PetBreedsController {
  constructor(private readonly petBreedsService: PetBreedsService) {}

  @Post(':typeId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_BREEDS, operation: AdminResourceOperationsEnum.CREATE })
  async createPetBreed(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: TypeIdParamDto,
    @Body() body: CreatePetBreedDto,
  ) {
    const petBreed = await this.petBreedsService.createPetBreed(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: petBreed },
    });
  }

  @Patch(':breedId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_BREEDS, operation: AdminResourceOperationsEnum.UPDATE })
  async updatePetBreed(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: BreedIdParamDto,
    @Body() body: UpdatePetBreedDto,
  ) {
    const petBreed = await this.petBreedsService.updatePetBreed(adminJWT._id, params, body);
    return new CustomResponse().success({
      payload: { data: petBreed },
    });
  }

  @Delete(':breedId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_BREEDS, operation: AdminResourceOperationsEnum.DELETE })
  async deletePetBreed(@Persona() adminJWT: AdminJwtPersona, @Param() params: BreedIdParamDto) {
    await this.petBreedsService.deletePetBreed(adminJWT._id, params);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_BREEDS, operation: AdminResourceOperationsEnum.READ })
  async getBreeds(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetBreedsQueryDto) {
    const petBreeds = await this.petBreedsService.getBreeds(adminJWT._id, query);
    return new CustomResponse().success({
      payload: petBreeds,
    });
  }

  @Get(':breedId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PET_BREEDS, operation: AdminResourceOperationsEnum.READ })
  async getBreedById(@Persona() adminJWT: AdminJwtPersona, @Param() param: BreedIdParamDto) {
    const petBreed = await this.petBreedsService.getBreedById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: petBreed,
      },
    });
  }
}
