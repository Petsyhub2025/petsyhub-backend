import { ServiceProvider, TransformObjectId } from '@instapets-backend/common';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class CreateServiceProviderDto extends PickType(ServiceProvider, [
  'fullName',
  'email',
  'phoneNumber',
  'anotherPhoneNumber',
] as const) {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  brand: Types.ObjectId;
}
