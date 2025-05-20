import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AppConfig,
  AwsS3Service,
  BaseSearchPaginationQuery,
  BranchServiceType,
  CustomError,
  ErrorType,
  GetImagePreSignedUrlQueryDto,
  IBranchServiceTypeModel,
  ISearchResponseData,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
  IBaseBranchModel,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { CreateBranchServiceTypeDto } from './dto/create-branch-service-type.dto';
import { UpdateBranchServiceTypeDto } from './dto/update-branch-service-type.dto';
import { getTypesPipeline } from './helpers/branch-service-types-pipeline.helper';
import { errorManager } from '@branches/admin/shared/config/errors.config';
import { TypeIdParamDto } from '@branches/admin/shared/dto/type-id-param.dto';

@Injectable()
export class BranchServiceTypesService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.BRANCH_SERVICE_TYPE)
    private branchServiceTypeModel: IBranchServiceTypeModel,
    @Inject(ModelNames.BASE_BRANCH) private baseBranchModel: IBaseBranchModel,
    private readonly s3Service: AwsS3Service,
    private readonly appConfig: AppConfig,
  ) {}

  async generatePresignedUrl(userId: string, { filename }: GetImagePreSignedUrlQueryDto) {
    const fileExtension = filename.split('.').pop();

    if (!fileExtension) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'File extension is missing',
            ar: 'مطلوب امتداد الملف',
          },
          event: 'FILE_EXTENSION_REQUIRED',
          errorType: ErrorType.WRONG_INPUT,
        }),
      );
    }

    const revisedFilename = `admin-clinic-service-provider-service-types-${userId}-${Date.now()}.${fileExtension}`;
    const filePath = `${userId}/clinic-service-provider-service-types/${revisedFilename}`;
    const preSignedUrl = await this.s3Service.generatePresignedUrl(filePath);
    const cloudFrontUrl = `${this.appConfig.MEDIA_DOMAIN}/${filePath}`;

    return {
      preSignedUrl,
      cloudFrontUrl,
    };
  }

  async createBranchServiceType(adminId: string, body: CreateBranchServiceTypeDto) {
    const { name, typePictureMedia, color } = body;

    if (
      await this.branchServiceTypeModel.exists({
        $or: [{ name }, { typePictureMedia }, { color }],
      })
    ) {
      throw new ConflictException(errorManager.BRANCH_SERVICE_TYPE_ALREADY_EXISTS);
    }

    const newBranchServiceType = new this.branchServiceTypeModel(body);
    const savedBranchServiceType = await newBranchServiceType.save();

    return savedBranchServiceType;
  }

  async updateBranchServiceType(adminId: string, { typeId }: TypeIdParamDto, body: UpdateBranchServiceTypeDto) {
    const { name, typePictureMedia, color } = body;

    if (name && (await this.branchServiceTypeModel.exists({ _id: { $ne: typeId }, name }))) {
      throw new ConflictException(errorManager.BRANCH_SERVICE_TYPE_ALREADY_EXISTS);
    }

    if (typePictureMedia && (await this.branchServiceTypeModel.exists({ _id: { $ne: typeId }, typePictureMedia }))) {
      throw new ConflictException(errorManager.BRANCH_SERVICE_TYPE_ALREADY_EXISTS);
    }

    if (color && (await this.branchServiceTypeModel.exists({ _id: { $ne: typeId }, color }))) {
      throw new ConflictException(errorManager.BRANCH_SERVICE_TYPE_ALREADY_EXISTS);
    }

    const BranchServiceType = await this.branchServiceTypeModel.findById(typeId);
    if (!BranchServiceType) {
      throw new NotFoundException(errorManager.BRANCH_SERVICE_TYPE_NOT_FOUND);
    }

    BranchServiceType.set(body);
    const savedBranchServiceType = await BranchServiceType.save();

    return savedBranchServiceType;
  }

  async deleteBranchServiceType(adminId: string, { typeId }: TypeIdParamDto) {
    const branchServiceType = await this.branchServiceTypeModel.findOne({ _id: typeId });

    if (!branchServiceType) {
      throw new NotFoundException(errorManager.BRANCH_SERVICE_TYPE_NOT_FOUND);
    }

    //TODO: update this when requirments change
    if (await this.baseBranchModel.exists({ serviceTypes: branchServiceType._id })) {
      throw new ForbiddenException(errorManager.BRANCH_SERVICE_TYPE_ALREADY_ASSIGNED_TO_BRANCHES);
    }

    await branchServiceType.deleteDoc();
  }

  async getBranchServiceTypes(
    adminId: string,
    query: BaseSearchPaginationQuery,
  ): Promise<ResponsePayload<BranchServiceType>> {
    const { page, limit, search } = query;
    if (search) {
      return this.getSearchedTypes(query);
    }
    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.branchServiceTypeModel.aggregate(matchStage).count('total'),
      this.branchServiceTypeModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...getTypesPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedTypes({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<BranchServiceType>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_BRANCH_SERVICE_TYPES_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.branchServiceTypeModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getTypesPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getBranchServiceTypeById(adminId: string, { typeId }: TypeIdParamDto) {
    const [branchServiceType] = await this.branchServiceTypeModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(typeId),
        },
      },
      ...getTypesPipeline(),
    ]);
    if (!branchServiceType) {
      throw new NotFoundException(errorManager.BRANCH_SERVICE_TYPE_NOT_FOUND);
    }

    return branchServiceType;
  }
}
