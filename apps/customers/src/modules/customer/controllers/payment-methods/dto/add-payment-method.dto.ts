import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AddPaymentMethodDto {
  @IsString()
  paymentMethodId: string;

  @IsString()
  paymentIntentId: string;

  @IsBoolean()
  @IsOptional()
  setDefault?: boolean = false;
}
