import { Body, Controller, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ServiceProviderProfileService } from './serviceprovider.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, NoApiVersion, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { UpdateServiceProviderProfileDto } from './dto/update-profile.dto';
import { GetServiceProvidersDto } from './dto/get-serviceproviders.dto';
import { CreateServiceProviderDto } from './dto/create-serviceprovider.dto';
import { ServiceProviderIdParamDto } from './dto/serviceprovider-id-param.dto';
import { ServiceProviderResetPasswordDto } from './dto/reset-password.dto';
import { BrandIdQueryDto } from '@serviceproviders/shared/dto/brand-id-query.dto';

@Controller({ path: 'serviceproviders', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class ServiceProviderProfileController {
  constructor(private serviceProviderProfileService: ServiceProviderProfileService) {}

  @ApiBearerAuth()
  @NoApiVersion()
  @Patch('profile')
  async updateServiceProviderSelf(
    @Persona() serviceProviderJwt: ServiceProviderJwtPersona,
    @Body() body: UpdateServiceProviderProfileDto,
  ) {
    await this.serviceProviderProfileService.updateSelfServiceProvider(serviceProviderJwt._id, body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Patch('reset-password')
  async resetServiceProviderCredentials(
    @Persona() serviceProviderJwt: ServiceProviderJwtPersona,
    @Body() body: ServiceProviderResetPasswordDto,
  ) {
    await this.serviceProviderProfileService.resetPassword(serviceProviderJwt._id, body);
    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Get('profile')
  async getServiceProviderSelf(@Persona() serviceProviderJwt: ServiceProviderJwtPersona) {
    return new CustomResponse().success({
      payload: { data: await this.serviceProviderProfileService.getSelfServiceProvider(serviceProviderJwt._id) },
    });
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Post('staff')
  async createServiceProvider(
    @Persona() serviceProviderJwt: ServiceProviderJwtPersona,
    @Body() body: CreateServiceProviderDto,
  ) {
    await this.serviceProviderProfileService.createStaffMember(serviceProviderJwt._id, body);
    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Get('staff')
  async getServiceProviders(
    @Persona() serviceProviderJwt: ServiceProviderJwtPersona,
    @Query() query: GetServiceProvidersDto,
  ) {
    const serviceProviders = await this.serviceProviderProfileService.getAllStaffMembers(serviceProviderJwt._id, query);
    return new CustomResponse().success({
      payload: serviceProviders,
    });
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Get('staff/:serviceProviderId')
  async getServiceProvider(
    @Persona() serviceProviderJwt: ServiceProviderJwtPersona,
    @Param() param: ServiceProviderIdParamDto,
    @Query() brandIdQueryDto: BrandIdQueryDto,
  ) {
    const serviceProvider = await this.serviceProviderProfileService.getServiceProviderById(
      serviceProviderJwt._id,
      param,
      brandIdQueryDto,
    );
    return new CustomResponse().success({
      payload: { data: serviceProvider },
    });
  }
}
