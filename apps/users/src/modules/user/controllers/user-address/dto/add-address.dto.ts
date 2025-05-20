import { PickType } from '@nestjs/swagger';
import { PointLocation, UserAddress } from '@instapets-backend/common';
import { IsBoolean, IsObject, ValidateIf, ValidateNested } from 'class-validator';

export class AddAddressDto extends PickType(UserAddress, ['city', 'country'] as const) {
  @IsObject()
  @ValidateNested()
  @ValidateIf((o) => !o.isPendingAddress)
  location?: PointLocation;

  @IsBoolean()
  isPendingAddress: boolean;
}
