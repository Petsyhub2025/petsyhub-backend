import { OrderPaymentMethodTypeEnum } from '@instapets-backend/common';
import { IsOptional, IsString } from 'class-validator';

export class PlaceOrderDto {
  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;

  @IsString()
  paymentMethodType: OrderPaymentMethodTypeEnum;
}
