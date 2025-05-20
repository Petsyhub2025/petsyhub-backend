import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@pets/shared/constants';
import {
  BaseSearchPaginationQuery,
  CustomResponse,
  GetImagePreSignedUrlQueryDto,
  JoiValidationPipe,
  Persona,
  UserJwtPersona,
} from '@instapets-backend/common';
import { pendingFollowIdParamDto } from '@pets/user/shared/dto/pending-follow-id-param.dto';
import { PetIdParamDto } from '@pets/user/shared/dto/pet-id-param.dto';
import { AddPetDto } from './dto/add-pet.dto';
import { GetPetFollowersQueryDto } from './dto/get-pet-followers.dto';
import { GetUserFollowedPetsQueryDto } from './dto/get-user-followed-pets.dto';
import { GetUserPetsQueryDto } from './dto/get-user-pets.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { getUserPetsSchema } from './joi-schemas/get-user-pets.schema';
import { PetsService } from './pets.service';
import { UpdatePetStatusDto } from './dto/update-pet-status.dto';
import { GetPetPendingFollowersQueryDto } from './dto/get-pet-pending-followers.dto';

@Controller({ path: 'pets', ...globalControllerVersioning })
@ApiTags('user')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @ApiBearerAuth()
  @Get()
  async getUserPets(
    @Persona() userJWT: UserJwtPersona,
    @Query(new JoiValidationPipe(getUserPetsSchema)) query: GetUserPetsQueryDto,
  ) {
    const pets = await this.petsService.getUserPets(userJWT._id, query);

    return new CustomResponse().success({
      payload: pets,
    });
  }

  @ApiBearerAuth()
  @Post()
  async addPet(@Persona() userJWT: UserJwtPersona, @Body() body: AddPetDto) {
    const pet = await this.petsService.addPet(userJWT._id, body);

    return new CustomResponse().success({
      payload: { data: pet },
    });
  }

  @ApiBearerAuth()
  @Get('all')
  async getPets(@Persona() userJWT: UserJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const pets = await this.petsService.getPets(userJWT._id, query);

    return new CustomResponse().success({
      payload: pets,
    });
  }

  @ApiBearerAuth()
  @Get('user-pet-followings')
  async getUserFollowedPets(@Persona() userJWT: UserJwtPersona, @Query() query: GetUserFollowedPetsQueryDto) {
    const pets = await this.petsService.getUserFollowedPets(userJWT._id, query);

    return new CustomResponse().success({
      payload: pets,
    });
  }

  @ApiBearerAuth()
  @Get('pending-followers')
  async getPetPendingFollowers(@Persona() userJWT: UserJwtPersona, @Query() query: GetPetPendingFollowersQueryDto) {
    const pets = await this.petsService.getPetPendingFollowers(userJWT._id, query);

    return new CustomResponse().success({
      payload: pets,
    });
  }

  @ApiBearerAuth()
  @Get('followers')
  async getPetFollowers(@Persona() userJWT: UserJwtPersona, @Query() query: GetPetFollowersQueryDto) {
    const pets = await this.petsService.getPetFollowers(userJWT._id, query);

    return new CustomResponse().success({
      payload: pets,
    });
  }

  @ApiBearerAuth()
  @Post('follow/:petId')
  async followPet(@Persona() userJWT: UserJwtPersona, @Param() params: PetIdParamDto) {
    await this.petsService.followPet(userJWT._id, params);
    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Delete('unfollow/:petId')
  async unFollowPet(@Persona() userJWT: UserJwtPersona, @Param() params: PetIdParamDto) {
    await this.petsService.unFollowPet(userJWT._id, params);
    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post('accept-follow/:pendingFollowId')
  async acceptPendingFollow(@Persona() userJWT: UserJwtPersona, @Param() param: pendingFollowIdParamDto) {
    await this.petsService.acceptPendingFollow(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Delete('decline-follow/:pendingFollowId')
  async declinePendingFollow(@Persona() userJWT: UserJwtPersona, @Param() param: pendingFollowIdParamDto) {
    await this.petsService.declinePendingFollow(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Delete('cancel-follow/:petId')
  async cancelPendingFollow(@Persona() userJWT: UserJwtPersona, @Param() param: PetIdParamDto) {
    await this.petsService.cancelPendingFollow(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Patch(':petId')
  async updatePet(@Persona() userJWT: UserJwtPersona, @Param() params: PetIdParamDto, @Body() body: UpdatePetDto) {
    const pet = await this.petsService.updatePet(userJWT._id, body, params);

    return new CustomResponse().success({
      payload: { data: pet },
    });
  }

  @ApiBearerAuth()
  @Get(':petId')
  async getPet(@Persona() userJWT: UserJwtPersona, @Param() params: PetIdParamDto) {
    const pet = await this.petsService.getPet(userJWT._id, params);

    return new CustomResponse().success({
      payload: { data: pet },
    });
  }

  @ApiBearerAuth()
  @Delete(':petId')
  async deletePet(@Persona() userJWT: UserJwtPersona, @Param() params: PetIdParamDto) {
    await this.petsService.deletePet(userJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':petId/status')
  async updatePetStatus(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: PetIdParamDto,
    @Body() body: UpdatePetStatusDto,
  ) {
    await this.petsService.updatePetStatus(userJWT._id, params, body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Delete(':petId/status')
  async removePetStatus(@Persona() userJWT: UserJwtPersona, @Param() params: PetIdParamDto) {
    await this.petsService.removePetStatus(userJWT._id, params);

    return new CustomResponse().success({});
  }

  @Post(':petId/mark-as-found')
  @ApiBearerAuth()
  async markLostPostAsFound(@Persona() userJWT: UserJwtPersona, @Param() params: PetIdParamDto) {
    await this.petsService.markPetAsFound(userJWT._id, params);

    return new CustomResponse().success({});
  }
}
