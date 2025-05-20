import { TransformObjectIds } from '@common/decorators/class-transformer';
import { BaseBranch, IBaseBranchInstanceMethods } from '@common/schemas/mongoose/branch/base-branch.type';
import { ArrayNotEmpty, IsArray, IsInstance } from 'class-validator';
import { Model, Types } from 'mongoose';

export class ClinicBranch extends BaseBranch {
  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  petTypes: Types.ObjectId[];

  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  serviceTypes: Types.ObjectId[];

  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  medicalSpecialties: Types.ObjectId[];
}

export interface IClinicBranchInstanceMethods extends IBaseBranchInstanceMethods {}
export interface IClinicBranchModel
  extends Model<ClinicBranch, Record<string, unknown>, IClinicBranchInstanceMethods> {}
