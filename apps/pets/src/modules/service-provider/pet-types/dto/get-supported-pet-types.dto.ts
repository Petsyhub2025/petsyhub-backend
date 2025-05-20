import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class GetSupportedPetTypesQueryDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branchId: Types.ObjectId;
}
