import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { BasePaginationQuery, CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { globalControllerVersioning } from '@discovery/shared/constants';

@Controller({ path: 'discovery', ...globalControllerVersioning })
@ApiTags('user/discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @ApiBearerAuth()
  @Get('/users')
  async getRecommendedUsers(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const users = await this.discoveryService.getRecommendedUsers(userJWT._id, query);

    return new CustomResponse().success({
      payload: users,
    });
  }

  @ApiBearerAuth()
  @Get('/pets')
  async getRecommendedPets(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const pets = await this.discoveryService.getRecommendedPets(userJWT._id, query);

    return new CustomResponse().success({
      payload: pets,
    });
  }
}
