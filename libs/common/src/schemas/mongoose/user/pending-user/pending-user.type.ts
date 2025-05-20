import { PickType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { User } from '@common/schemas/mongoose/user/user.type';
import { IsOptional, IsString } from 'class-validator';
import { IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class PendingUser extends PickType(User, ['email', 'password'] as const) {
  constructor(pendingUser: PendingUser) {
    super(pendingUser);
    Object.assign(this, pendingUser);
  }

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;
}

export interface IPendingUserInstanceMethods extends IBaseInstanceMethods {}
export interface IPendingUserModel extends Model<PendingUser, Record<string, unknown>, IPendingUserInstanceMethods> {}
