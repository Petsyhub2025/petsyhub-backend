import { PetIdParamDto } from '@pets/admin/shared/dto/pet-id-param.dto';
import { errorManager } from '@pets/admin/shared/config/errors.config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  IPetModel,
  ISearchResponseData,
  ModelNames,
  Pet,
  PetAdminRpcPayload,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { GetPetsDto } from './dto/get-pets.dto';
import { getPetPipeline, getPetsPipeline } from './helpers/pets-pipeline.helper';

@Injectable()
export class PetsService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  async getPets(adminId: string, query: GetPetsDto) {
    const { page, limit, search, breedId, typeId, userId } = query;
    if (search) {
      return this.getSearchedPets(query);
    }
    const matchStage = [
      {
        $match: {
          ...(typeId ? { type: new Types.ObjectId(typeId) } : {}),
          ...(breedId ? { breed: new Types.ObjectId(breedId) } : {}),
          ...(userId ? { 'user.userId': new Types.ObjectId(userId) } : {}),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.petModel.aggregate(matchStage).count('total'),
      this.petModel.aggregate([...matchStage, ...addPaginationStages({ page, limit }), ...getPetsPipeline()]),
    ]);

    const count = await this.petModel.countDocuments();

    return {
      data: docs,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
      petsCount: count * 43,
    };
  }

  private async getSearchedPets({
    page,
    limit,
    search,
    breedId,
    typeId,
    userId,
  }: GetPetsDto): Promise<ResponsePayload<Pet>> {
    const payload: PetAdminRpcPayload = {
      page,
      limit,
      search,
      petBreedId: breedId,
      petTypeId: typeId,
      userId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PETS_SEARCH_DATA,
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
      ...getPetsPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getPetById(adminId: string, { petId }: PetIdParamDto) {
    const [pet] = await this.petModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(petId),
        },
      },
      ...getPetPipeline(),
    ]);
    if (!pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    return pet;
  }
}
