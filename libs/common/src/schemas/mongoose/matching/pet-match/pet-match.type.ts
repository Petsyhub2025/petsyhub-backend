import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsBirthDate } from '@common/decorators/class-validator/common';
import {
  IsInstance,
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  IsNumber,
  Max,
  Min,
  IsBoolean,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { PetMatchStatusEnum } from './pet-match.enum';

export class PetMatch extends BaseModel<PetMatch> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  receiverUser: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  requesterUser: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  pet: Types.ObjectId;

  @IsString()
  @IsEnum(PetMatchStatusEnum)
  status: PetMatchStatusEnum;

  @IsDate()
  expiresAt: Date;
}

export interface IPetMatchInstanceMethods extends IBaseInstanceMethods {}
export interface IPetMatchModel extends Model<PetMatch, Record<string, unknown>, IPetMatchInstanceMethods> {}
