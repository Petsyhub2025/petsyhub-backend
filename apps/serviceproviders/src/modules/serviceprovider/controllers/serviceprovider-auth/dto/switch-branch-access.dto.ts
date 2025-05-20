import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class SwitchBranchAccessDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branchId: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  brandId: Types.ObjectId;
}
