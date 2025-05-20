import { TypeIdParamDto } from '@pets/admin/shared/dto/type-id-param.dto';
import { errorManager } from '@pets/admin/shared/config/errors.config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  IPetModel,
  IPetTypeModel,
  ISearchResponseData,
  ModelNames,
  PetType,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { CreatePetTypeDto } from './dto/create-pet-type.dto';
import { UpdatePetTypeDto } from './dto/update-pet-type.dto';
import { getTypesPipeline } from './helpers/pet-types-pipeline.helper';

@Injectable()
export class PetTypesService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  async createPetType(adminId: string, { name }: CreatePetTypeDto) {
    if (await this.petTypeModel.exists({ name })) {
      throw new ConflictException(errorManager.PET_TYPE_ALREADY_EXISTS);
    }

    const newPetType = new this.petTypeModel({ name });
    const savedPetType = await newPetType.save();

    return savedPetType;
  }

  async updatePetType(adminId: string, { typeId }: TypeIdParamDto, { name }: UpdatePetTypeDto) {
    if (await this.petTypeModel.exists({ _id: { $ne: typeId }, name })) {
      throw new ConflictException(errorManager.PET_TYPE_ALREADY_EXISTS);
    }

    const petType = await this.petTypeModel.findById(typeId);
    if (!petType) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }

    petType.set({ name });
    const savedPetType = await petType.save();

    return savedPetType;
  }

  async deletePetType(adminId: string, { typeId }: TypeIdParamDto) {
    const petType = await this.petTypeModel.findOne({ _id: typeId });

    if (!petType) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }

    //TODO:revisit when any change is made to pet type and breed
    if (await this.petModel.exists({ type: typeId })) {
      throw new ForbiddenException(errorManager.PET_TYPE_HAS_USERS);
    }

    await petType.deleteDoc();
  }

  async getPetTypes(adminId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<PetType>> {
    const { page, limit, search } = query;
    if (search) {
      return this.getSearchedTypes(query);
    }
    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.petTypeModel.aggregate(matchStage).count('total'),
      this.petTypeModel.aggregate([...matchStage, ...addPaginationStages({ page, limit }), ...getTypesPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedTypes({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<PetType>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PET_TYPES_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.petTypeModel.aggregate([
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

  async getPetTypeById(adminId: string, { typeId }: TypeIdParamDto) {
    const petType = await this.petTypeModel
      .findById(typeId, {
        _id: 1,
        name: 1,
      })
      .lean();
    if (!petType) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }

    return petType;
  }
}
