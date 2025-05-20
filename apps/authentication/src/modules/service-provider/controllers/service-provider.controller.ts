import { Controller, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ServiceProviderService } from './service-provider.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse, IsPrivateAuthOrPublic, NoApiVersion } from '@instapets-backend/common';
import { ServiceProviderJwtAuthGuard } from '../guards/service-provider-jwt.guard';

@Controller({ path: 'serviceprovider', version: VERSION_NEUTRAL })
export class ServiceProviderController {
  constructor(private readonly serviceProviderService: ServiceProviderService) {}

  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @UseGuards(ServiceProviderJwtAuthGuard)
  @Post('authentication')
  authenticateServiceProvider(): CustomResponse {
    return new CustomResponse().success({
      event: 'SERVICE_PROVIDER_AUTHENTICATE_SUCCESS',
      localizedMessage: {
        en: 'Service Provider authenticated successfully',
        ar: 'تم تأكيد المستخدم بنجاح',
      },
      statusCode: 200,
    });
  }
}
