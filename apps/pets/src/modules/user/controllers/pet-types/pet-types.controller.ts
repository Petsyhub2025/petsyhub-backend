import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { PetTypesService } from './pet-types.service';
import { globalControllerVersioning } from '@pets/shared/constants';

@Controller({ path: 'pet-types', ...globalControllerVersioning })
@ApiTags('user')
export class PetTypesController {
  constructor(private readonly petTypeService: PetTypesService) {}

  @ApiBearerAuth()
  @Get()
  async getPetTypes(@Persona() userJWT: UserJwtPersona) {
    const petTypes = await this.petTypeService.getPetTypes(userJWT._id);

    return new CustomResponse().success({
      payload: { data: petTypes },
    });
  }
}
