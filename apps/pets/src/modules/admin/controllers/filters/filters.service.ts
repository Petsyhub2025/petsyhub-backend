import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  BaseSearchPaginationQuery,
  FoundPost,
  IFoundPostModel,
  ILostPostModel,
  IPetBreedModel,
  IPetModel,
  IPetTypeModel,
  ISearchResponseData,
  LostPost,
  Pet,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { errorManager } from '@pets/admin/shared/config/errors.config';
import { PipelineStage, Types } from 'mongoose';
import {
  getFoundPostFilterPipeline,
  getLostPostsFilterPipeline,
  getPetsFilterOptionsPipeline,
} from './helpers/filters-pipeline.helper';
import { GetPetBreedsFilterOptionsQueryDto } from './dto/get-pet-breeds-filter-options.dto';

@Injectable()
export class FiltersService {
  constructor(
    @Inject(ModelNames.LOST_POST) private readonly lostPostModel: ILostPostModel,
    @Inject(ModelNames.FOUND_POST) private readonly foundPostModel: IFoundPostModel,
    @Inject(ModelNames.PET_TYPE) private readonly petTypeModel: IPetTypeModel,
    @Inject(ModelNames.PET_BREED) private readonly petBreedModel: IPetBreedModel,
    @Inject(ModelNames.PET) private readonly petModel: IPetModel,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getLostPostsFilterOptions(
    adminId: string,
    query: BaseSearchPaginationQuery,
  ): Promise<ResponsePayload<LostPost>> {
    const { limit, page, search } = query;

    if (search) {
      return this.getSearchedLostPostsFilterOptions(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {},
      },
    ];

    const [lostPosts, [{ total = 0 } = {}]] = await Promise.all([
      this.lostPostModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getLostPostsFilterPipeline(),
      ]),
      this.lostPostModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: lostPosts,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedLostPostsFilterOptions({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<LostPost>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_FILTER_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.lostPostModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getLostPostsFilterPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getFoundPostsFilterOptions(
    adminId: string,
    query: BaseSearchPaginationQuery,
  ): Promise<ResponsePayload<FoundPost>> {
    const { limit, page, search } = query;

    if (search) {
      return this.getSearchedFoundPostsFilterOptions(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {},
      },
    ];

    const [foundPosts, [{ total = 0 } = {}]] = await Promise.all([
      this.foundPostModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getFoundPostFilterPipeline(),
      ]),
      this.foundPostModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: foundPosts,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedFoundPostsFilterOptions({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<FoundPost>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_FILTER_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.foundPostModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getFoundPostFilterPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getPetTypesFilterOptions(adminId: string) {
    const petTypes = await this.petTypeModel.find({}, { _id: 1, name: 1 }).lean();

    return petTypes;
  }

  async getPetBreedsFilterOptions(adminId: string, query: GetPetBreedsFilterOptionsQueryDto) {
    const { type } = query;

    const petBreeds = await this.petBreedModel.find({ ...(type ? { type } : {}) }, { _id: 1, name: 1 }).lean();

    return petBreeds;
  }

  async getPetsFilterOptions(adminId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<Pet>> {
    const { limit, page, search } = query;

    const matchStage: PipelineStage[] = [
      {
        $match: {},
      },
    ];

    if (search) {
      return this.getSearchedPetsFilterOptions(query);
    }

    const [pets, [{ total = 0 } = {}]] = await Promise.all([
      this.petModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getPetsFilterOptionsPipeline(),
      ]),
      this.petModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: pets,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedPetsFilterOptions({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<Pet>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PETS_SEARCH_FILTER_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.petModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getPetsFilterOptionsPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }
}
