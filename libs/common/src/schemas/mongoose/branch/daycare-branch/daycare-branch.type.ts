import { BaseBranch, IBaseBranchInstanceMethods } from '@common/schemas/mongoose/branch/base-branch.type';
import { Model } from 'mongoose';

export class DayCareBranch extends BaseBranch {}

export interface IDayCareBranchInstanceMethods extends IBaseBranchInstanceMethods {}
export interface IDayCareBranchModel
  extends Model<DayCareBranch, Record<string, unknown>, IDayCareBranchInstanceMethods> {}
