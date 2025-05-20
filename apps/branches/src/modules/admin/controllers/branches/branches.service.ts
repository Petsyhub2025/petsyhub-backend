import { ModelNames } from '@common/constants';
import {
  addPaginationStages,
  BranchStatusEnum,
  IBaseBranchModel,
  IBranchAccessControlModel,
  IServiceProviderModel,
  ServiceProviderEventsEnum,
  TemplateManagerService,
} from '@instapets-backend/common';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';
import { GetBranchesDto } from './dto/get-branches.dto';
import { BranchIdParamDto } from '@branches/shared/dto/branch-id-param.dto';
import { errorManager } from '@branches/admin/shared/config/errors.config';
import { RejectBranchDto } from './dto/reject-branch.dto';
import { GetBranchesPipeline } from './aggregations/get-branches-pipeline.aggregation';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetBranchByIdPipeline } from './aggregations/get-branch-by-id-pipeline.aggregation';
@Injectable()
export class BranchesService {
  constructor(
    @Inject(ModelNames.BASE_BRANCH)
    private readonly baseBranchModel: IBaseBranchModel,
    @Inject(ModelNames.BRANCH_ACCESS_CONTROL)
    private readonly branchAccessControlModel: IBranchAccessControlModel,
    @Inject(ModelNames.SERVICE_PROVIDER)
    private readonly serviceProviderModel: IServiceProviderModel,
    private readonly templateService: TemplateManagerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getBranches(adminId: string | Types.ObjectId, getBranchesDto: GetBranchesDto) {
    const { page, limit, status, area, city, country, branchType, dateFilterType, dateFrom, dateTo } = getBranchesDto;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(errorManager.INVALID_DATE_RANGE);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(status && { status }),
          ...(area && { area: new Types.ObjectId(area) }),
          ...(city && { city: new Types.ObjectId(city) }),
          ...(country && { country: new Types.ObjectId(country) }),
          ...(branchType && { branchType }),
          ...(dateFilterType &&
            dateFrom &&
            dateTo && {
              [dateFilterType]: {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTo),
              },
            }),
        },
      },
    ];
    const [[{ total = 0 } = {}], branches] = await Promise.all([
      this.baseBranchModel.aggregate(matchStage).count('total'),
      this.baseBranchModel.aggregate([
        ...matchStage,
        { $sort: { createdAt: -1 } },
        ...addPaginationStages({ limit, page }),
        ...GetBranchesPipeline(),
      ]),
    ]);

    return { data: branches, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getBranchById(adminId: string | Types.ObjectId, { branchId }: BranchIdParamDto) {
    const branch = await this.baseBranchModel.aggregate([...GetBranchByIdPipeline(branchId)]);
    if (!branch || !branch.length) throw new NotFoundException(errorManager.BRANCH_NOT_FOUND);

    return branch[0];
  }

  async acceptBranch(adminId: string | Types.ObjectId, { branchId }: BranchIdParamDto) {
    const branch = await this.baseBranchModel.findById(branchId);
    if (!branch) throw new NotFoundException(errorManager.BRANCH_NOT_FOUND);

    if (branch.status !== BranchStatusEnum.PENDING_ADMIN_APPROVAL) {
      throw new ConflictException(errorManager.BRANCH_STATUS_NOT_VALID);
    }
    await branch.approveDoc();

    const branchAccessControl = await this.branchAccessControlModel.findOne({ branch: branchId });
    const serviceProvider = await this.serviceProviderModel.findById(branchAccessControl.serviceProvider);

    this.eventEmitter.emit(ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_APPROVED, { serviceProvider, branch });
  }

  async rejectBranch(
    adminId: string | Types.ObjectId,
    { branchId }: BranchIdParamDto,
    { rejectionReason }: RejectBranchDto,
  ) {
    const branch = await this.baseBranchModel.findById(branchId);
    if (!branch) throw new NotFoundException(errorManager.BRANCH_NOT_FOUND);

    if (branch.status !== BranchStatusEnum.PENDING_ADMIN_APPROVAL) {
      throw new ConflictException(errorManager.BRANCH_STATUS_NOT_VALID);
    }
    await branch.rejectDoc(rejectionReason);

    const branchAccessControl = await this.branchAccessControlModel.findOne({ branch: branchId });
    const serviceProvider = await this.serviceProviderModel.findById(branchAccessControl.serviceProvider);

    this.eventEmitter.emit(ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_REJECTED, {
      serviceProvider,
      branch,
      rejectionReason,
    });
  }

  async suspendBranch(adminId: string | Types.ObjectId, { branchId }: BranchIdParamDto) {
    const branch = await this.baseBranchModel.findById(branchId);
    if (!branch) throw new NotFoundException(errorManager.BRANCH_NOT_FOUND);

    if (branch.status === BranchStatusEnum.SUSPENDED || branch.status === BranchStatusEnum.PENDING_ADMIN_APPROVAL) {
      throw new ConflictException(errorManager.BRANCH_STATUS_NOT_VALID);
    }
    await branch.suspendDoc();
  }

  async unSuspendBranch(adminId: string | Types.ObjectId, { branchId }: BranchIdParamDto) {
    const branch = await this.baseBranchModel.findById(branchId);
    if (!branch) throw new NotFoundException(errorManager.BRANCH_NOT_FOUND);

    if (branch.status !== BranchStatusEnum.SUSPENDED) {
      throw new ConflictException(errorManager.BRANCH_STATUS_NOT_VALID);
    }
    await branch.unSuspendDoc();
  }
}
