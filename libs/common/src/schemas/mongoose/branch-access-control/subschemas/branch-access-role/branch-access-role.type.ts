import { TransformObjectId } from '@common/decorators/class-transformer';
import { PickType } from '@nestjs/swagger';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';
import { BranchAccessRole } from '@common/schemas/mongoose/branch-access-control/branch-access-role';

export class BranchAccessRoleSubSchemaType extends PickType(BranchAccessRole, ['name', 'level']) {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  _id: Types.ObjectId;
}
