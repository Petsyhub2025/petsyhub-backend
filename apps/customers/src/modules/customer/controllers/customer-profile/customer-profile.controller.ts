import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@customers/shared/constants';
import { CustomResponse, Persona, CustomerJwtPersona } from '@instapets-backend/common';
import { EditProfileDto } from './dto/edit-profile.dto';
import { CustomerProfileService } from './customer-profile.service';

@Controller({ path: 'profile', ...globalControllerVersioning })
@ApiTags('customer/profile')
export class CustomerProfileController {
  constructor(private readonly customerProfileService: CustomerProfileService) {}

  @Get()
  @ApiBearerAuth()
  async getProfile(@Persona() customerJWT: CustomerJwtPersona) {
    const customer = await this.customerProfileService.getCustomerProfile(customerJWT._id);

    return new CustomResponse().success({
      payload: { data: customer },
    });
  }

  @Patch()
  @ApiBearerAuth()
  async editProfile(@Persona() customerJWT: CustomerJwtPersona, @Body() body: EditProfileDto) {
    const customer = await this.customerProfileService.editProfile(customerJWT._id, body);

    return new CustomResponse().success({
      payload: { data: customer },
    });
  }

  @Delete()
  @ApiBearerAuth()
  async deleteProfile(@Persona() customerJWT: CustomerJwtPersona) {
    await this.customerProfileService.deleteProfile(customerJWT._id);

    return new CustomResponse().success({});
  }
}
