import { BaseBranch, IBaseBranchInstanceMethods } from '@common/schemas/mongoose/branch/base-branch.type';
import { Model } from 'mongoose';

export class HostelBranch extends BaseBranch {}

export interface IHostelBranchInstanceMethods extends IBaseBranchInstanceMethods {}
export interface IHostelBranchModel
  extends Model<HostelBranch, Record<string, unknown>, IHostelBranchInstanceMethods> {}
