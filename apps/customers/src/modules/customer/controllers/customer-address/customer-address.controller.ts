import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@customers/shared/constants';
import { CustomResponse, Persona, CustomerJwtPersona, LocationDto } from '@instapets-backend/common';
import { CustomerAddressService } from './customer-address.service';
import { AddAddressDto } from './dto/add-address.dto';
import { AddressParamIdDto } from './dto/address-param-id.dto';
import { EditAddressDto } from './dto/edit-address.dto';

@Controller({ path: 'address', ...globalControllerVersioning })
@ApiTags('customer/address')
export class CustomerAddressController {
  constructor(private readonly customerAddressService: CustomerAddressService) {}

  @Post()
  @ApiBearerAuth()
  async addAddress(@Persona() customerJWT: CustomerJwtPersona, @Body() body: AddAddressDto) {
    await this.customerAddressService.addAddress(customerJWT._id, body);

    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  async getSavedAddresses(@Persona() customerJWT: CustomerJwtPersona) {
    const savedAddresses = await this.customerAddressService.getSavedAddresses(customerJWT._id);

    return new CustomResponse().success({
      payload: { data: savedAddresses },
    });
  }

  @Get('current-location')
  @ApiBearerAuth()
  async getCurrentAddress(@Persona() customerJWT: CustomerJwtPersona, @Query() location: LocationDto) {
    const currentLocation = await this.customerAddressService.getMyCurrentLocation(customerJWT._id, location);

    return new CustomResponse().success({
      payload: { data: currentLocation },
    });
  }

  @Get(':addressId')
  @ApiBearerAuth()
  async getSavedAddressById(@Persona() customerJWT: CustomerJwtPersona, @Param() param: AddressParamIdDto) {
    const savedAddress = await this.customerAddressService.getSavedAddressById(customerJWT._id, param);

    return new CustomResponse().success({
      payload: { data: savedAddress },
    });
  }

  @Patch(':addressId')
  @ApiBearerAuth()
  async updateAddress(
    @Persona() customerJWT: CustomerJwtPersona,
    @Param() param: AddressParamIdDto,
    @Body() body: EditAddressDto,
  ) {
    await this.customerAddressService.editAddress(customerJWT._id, param, body);

    return new CustomResponse().success({});
  }

  @Patch(':addressId/set-default')
  @ApiBearerAuth()
  async setAddressDefault(@Persona() customerJWT: CustomerJwtPersona, @Param() param: AddressParamIdDto) {
    await this.customerAddressService.setDefaultAddress(customerJWT._id, param);

    return new CustomResponse().success({});
  }
}
