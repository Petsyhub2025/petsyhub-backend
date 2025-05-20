import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class AddressParamIdDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  addressId: Types.ObjectId;
}
