import { Controller, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse, IsPrivateAuthOrPublic, NoApiVersion } from '@instapets-backend/common';
import { CustomerJwtAuthGuard } from '@authentication/customer/guards/customer-jwt.guard';

@Controller({ path: 'customer', version: VERSION_NEUTRAL })
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Post('authentication')
  authenticateCustomer(): CustomResponse {
    return new CustomResponse().success({
      event: 'CUSTOMER_AUTHENTICATE_SUCCESS',
      localizedMessage: {
        en: 'Customer authenticated successfully',
        ar: 'تم تأكيد المستخدم بنجاح',
      },
      statusCode: 200,
    });
  }
}
