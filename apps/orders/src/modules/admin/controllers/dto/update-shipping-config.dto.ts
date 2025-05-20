import { ShippingConfig } from '@instapets-backend/common';
import { PickType } from '@nestjs/swagger';

export class UpdateShippingConfigDto extends PickType(ShippingConfig, [
  'estimatedArrivalTime',
  'estimatedArrivalUnit',
  'shippingFee',
  'tax',
] as const) {}
