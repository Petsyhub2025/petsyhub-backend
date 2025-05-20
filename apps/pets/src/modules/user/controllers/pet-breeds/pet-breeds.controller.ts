import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PetBreedsService } from './pet-breeds.service';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { GetPetBreedsQueryDto } from './dto/get-pet-breeds.dto';
import { globalControllerVersioning } from '@pets/shared/constants';

@Controller({ path: 'pet-breeds', ...globalControllerVersioning })
@ApiTags('user')
export class PetBreedsController {
  constructor(private readonly petBreedsService: PetBreedsService) {}

  @ApiBearerAuth()
  @Get()
  async getPetBreeds(@Persona() userJWT: UserJwtPersona, @Query() query: GetPetBreedsQueryDto) {
    const petBreeds = await this.petBreedsService.getPetBreeds(userJWT._id, query);

    return new CustomResponse().success({
      payload: { data: petBreeds },
    });
  }
}
