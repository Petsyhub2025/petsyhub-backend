import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BranchStatusEnum,
  BranchTypeEnum,
  IBaseAppointmentModel,
  IBaseBranchModel,
  IBranchServiceTypeModel,
  IUserModel,
  ModelNames,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { GetBranchesQueryDto } from './dto/get-branches-query.dto';
import { BranchIdParamDto } from '@branches/shared/dto/branch-id-param.dto';
import { branchesPopulationPipeline } from './helpers/branches-pipeline.helper';

@Injectable()
export class BranchesService {
  constructor(
    @Inject(ModelNames.BRANCH_SERVICE_TYPE)
    private readonly branchServiceTypeModel: IBranchServiceTypeModel,
    @Inject(ModelNames.BASE_BRANCH)
    private readonly baseBranchModel: IBaseBranchModel,
    @Inject(ModelNames.USER) private readonly userModel: IUserModel,
    @Inject(ModelNames.BASE_APPOINTMENT) private baseAppointmentModel: IBaseAppointmentModel,
  ) {}

  async getBranchById(userId: string, { branchId }: BranchIdParamDto) {
    const [branch] = await this.baseBranchModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(branchId),
          status: BranchStatusEnum.APPROVED,
        },
      },
      ...branchesPopulationPipeline(),
    ]);

    if (!branch) {
      throw new NotFoundException();
    }

    return branch;
  }

  async getBranches(userId: string | Types.ObjectId, query: GetBranchesQueryDto) {
    const { page, limit, branchType, lat, lng } = query;

    const user = await this.userModel.findById(userId, { _id: 0, city: 1, country: 1 }).lean();
    //TODO: Add search
    const queryObject = {
      ...(branchType ? { branchType } : { branchType: BranchTypeEnum.CLINIC }),
      status: BranchStatusEnum.APPROVED,
      ...(user?.city && { city: new Types.ObjectId(user.city) }),
      ...(user?.country && { country: new Types.ObjectId(user.country) }),
    };

    //eslint-disable-next-line
    let [[{ total = 0 } = {}], docs] = await Promise.all([
      this.baseBranchModel.aggregate([{ $match: queryObject }]).count('total'),
      this.baseBranchModel.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'dist.calculated',
            query: { ...queryObject },
            spherical: true,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...branchesPopulationPipeline(true),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getBranchRelatedBranches(
    userId: string | Types.ObjectId,
    { branchId }: BranchIdParamDto,
    { lat, lng, brandId }: GetBranchesQueryDto,
  ) {
    const queryObject = {
      branchType: BranchTypeEnum.CLINIC,
      status: BranchStatusEnum.APPROVED,
      _id: { $ne: new Types.ObjectId(branchId) },
      brand: new Types.ObjectId(brandId),
    };

    //eslint-disable-next-line
    let [[{ total = 0 } = {}], docs] = await Promise.all([
      this.baseBranchModel.aggregate([{ $match: queryObject }]).count('total'),
      this.baseBranchModel.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'dist.calculated',
            query: { ...queryObject },
            spherical: true,
          },
        },
        ...branchesPopulationPipeline(true),
      ]),
    ]);

    return { data: docs, total };
  }
}
