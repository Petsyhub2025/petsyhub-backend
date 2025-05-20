import { ApiProperty, PickType } from '@nestjs/swagger';
import { Admin, TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class CreateAdminDto extends PickType(Admin, ['email', 'firstName', 'lastName', 'permissions'] as const) {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  roleId: Types.ObjectId;
}
