import { Body, Controller, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@users/shared/constants';
import { CustomResponse, LocationDto, Persona, UserJwtPersona } from '@instapets-backend/common';
import { UserAddressService } from './user-address.service';

@Controller({ path: 'address', ...globalControllerVersioning })
@ApiTags('user/address')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @Put()
  @ApiBearerAuth()
  async adjustUserLocation(@Persona() userJWT: UserJwtPersona, @Body() body: LocationDto) {
    await this.userAddressService.adjustUserLocation(userJWT._id, body);

    return new CustomResponse().success({});
  }

  // TODO: Temporarily commented out until the address feature is ready
  // @Put()
  // @ApiBearerAuth()
  // async addAddress(@Persona() userJWT: UserJwtPersona, @Body() body: AddAddressDto) {
  //   const address = await this.userAddressService.addAddress(userJWT._id, body);

  //   return new CustomResponse().success({
  //     payload: { data: address },
  //   });
  // }
}
