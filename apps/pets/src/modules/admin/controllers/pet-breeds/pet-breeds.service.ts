import { BreedIdParamDto } from '@pets/admin/shared/dto/breed-id-param.dto';
import { TypeIdParamDto } from '@pets/admin/shared/dto/type-id-param.dto';
import { errorManager } from '@pets/admin/shared/config/errors.config';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  IPetBreedModel,
  IPetModel,
  IPetTypeModel,
  ISearchResponseData,
  ModelNames,
  PetBreed,
  PetBreedAdminRpcPayload,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { CreatePetBreedDto } from './dto/create-pet-breed.dto';
import { GetBreedsQueryDto } from './dto/get-pet-breeds.dto';
import { UpdatePetBreedDto } from './dto/update-pet-breed.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getBreedsPipeline } from './helpers/pet-breeds-pipeline.helper';

@Injectable()
export class PetBreedsService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.PET_BREED) private petBreedModel: IPetBreedModel,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  async createPetBreed(adminId: string, { typeId }: TypeIdParamDto, { name }: CreatePetBreedDto) {
    if (!(await this.petTypeModel.exists({ _id: typeId }))) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }

    if (await this.petBreedModel.exists({ type: typeId, name })) {
      throw new ConflictException(errorManager.PET_BREED_ALREADY_EXISTS);
    }

    const newPetBreed = new this.petBreedModel({ type: typeId, name });
    const savedPetBreed = await newPetBreed.save();

    const petBreed = await this.petBreedModel
      .findById(savedPetBreed._id, {
        name: 1,
        type: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .populate({
        path: 'type',
      });

    return petBreed;
  }

  async updatePetBreed(adminId: string, { breedId }: BreedIdParamDto, { name }: UpdatePetBreedDto) {
    const oldPetBreed = await this.petBreedModel.findById(breedId);
    if (!oldPetBreed) {
      throw new NotFoundException(errorManager.PET_BREED_NOT_FOUND);
    }

    if (await this.petBreedModel.exists({ _id: { $ne: breedId }, type: oldPetBreed.type, name })) {
      throw new ConflictException(errorManager.PET_BREED_ALREADY_EXISTS);
    }

    oldPetBreed.set({ name });
    await oldPetBreed.save();

    const petBreed = await this.petBreedModel
      .findById(oldPetBreed._id, {
        name: 1,
        type: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .populate({
        path: 'type',
      });

    return petBreed;
  }

  async deletePetBreed(adminId: string, { breedId }: BreedIdParamDto) {
    const petBreed = await this.petBreedModel.findOne({ _id: breedId });

    if (!petBreed) {
      throw new NotFoundException(errorManager.PET_BREED_NOT_FOUND);
    }

    //TODO:revisit when any change is made to pet type and breed
    if (await this.petModel.exists({ breed: breedId })) {
      throw new ForbiddenException(errorManager.PET_BREED_HAS_USERS);
    }

    await petBreed.deleteDoc();
  }

  async getBreeds(adminId: string, query: GetBreedsQueryDto): Promise<ResponsePayload<PetBreed>> {
    const { page, limit, search, typeId } = query;
    if (search) {
      return this.getSearchedBreeds(query);
    }
    const matchStage = [{ $match: { ...(typeId ? { type: new Types.ObjectId(typeId) } : {}) } }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.petBreedModel.aggregate(matchStage).count('total'),
      this.petBreedModel.aggregate([...matchStage, ...addPaginationStages({ page, limit }), ...getBreedsPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedBreeds({
    page,
    limit,
    search,
    typeId,
  }: GetBreedsQueryDto): Promise<ResponsePayload<PetBreed>> {
    const payload: PetBreedAdminRpcPayload = {
      page,
      limit,
      search,
      petTypeId: typeId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PET_BREEDS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.petBreedModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getBreedsPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getBreedById(adminId: string, { breedId }: BreedIdParamDto) {
    const petBreed = await this.petBreedModel
      .findById(breedId, {
        _id: 1,
        type: 1,
        name: 1,
      })
      .populate({
        path: 'type',
        select: {
          _id: 1,
          name: 1,
        },
      })
      .lean();
    if (!petBreed) {
      throw new NotFoundException(errorManager.PET_BREED_NOT_FOUND);
    }

    return petBreed;
  }
}
