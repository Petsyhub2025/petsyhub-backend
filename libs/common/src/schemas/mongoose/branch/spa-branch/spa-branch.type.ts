import { BaseBranch, IBaseBranchInstanceMethods } from '@common/schemas/mongoose/branch/base-branch.type';
import { Model } from 'mongoose';

export class SpaBranch extends BaseBranch {}

export interface ISpaBranchInstanceMethods extends IBaseBranchInstanceMethods {}
export interface ISpaBranchModel extends Model<SpaBranch, Record<string, unknown>, ISpaBranchInstanceMethods> {}
