import { IsString } from 'class-validator';

export class PaymentMethodIdParamDto {
  @IsString()
  paymentMethodId: string;
}
