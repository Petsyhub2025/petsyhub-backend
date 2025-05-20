import { globalControllerVersioning } from '@customers/shared/constants';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CustomerJwtPersona, CustomResponse, Persona } from '@instapets-backend/common';
import { CreateVerificationIntentDto } from './dto/create-verification-intent.dto';
import { PaymentMethodIdParamDto } from './dto/payment-method-id-param.dto';

@Controller({ path: 'payment-methods', ...globalControllerVersioning })
@ApiTags('customer/payment-methods')
export class PaymentMethodsController {
  constructor(private paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiBearerAuth()
  async getPaymentMethods(@Persona() customerJWT: CustomerJwtPersona) {
    const paymentMethods = await this.paymentMethodsService.getPaymentMethods(customerJWT._id);
    return new CustomResponse().success({
      payload: { data: paymentMethods },
    });
  }

  @Get('verification-intent')
  @ApiBearerAuth()
  async createVerificationIntent(@Persona() customerJWT: CustomerJwtPersona) {
    const result = await this.paymentMethodsService.createVerificationIntent(customerJWT._id);
    return new CustomResponse().success({
      payload: { data: result },
    });
  }

  @Get(':paymentMethodId')
  @ApiBearerAuth()
  async getPaymentMethodById(@Persona() customerJWT: CustomerJwtPersona, @Param() param: PaymentMethodIdParamDto) {
    const result = await this.paymentMethodsService.getPaymentMethodById(customerJWT._id, param);
    return new CustomResponse().success({
      payload: { data: result },
    });
  }
}
