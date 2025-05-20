import { TransformObjectId } from '@common/decorators/class-transformer';
import { PickType } from '@nestjs/swagger';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';
import { AdminRole } from '../../admin-role/admin-role.type';

export class AdminRoleSubSchemaType extends PickType(AdminRole, ['name']) {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  _id: Types.ObjectId;
}
