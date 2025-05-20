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
  EventCategory,
  IEventCategoryModel,
  IEventModel,
  ISearchResponseData,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { errorManager } from '@events/admin/shared/config/errors.config';
import { EventCategoryIdParamDto } from '@events/admin/shared/dto/event-category-id-param.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { getEventCategoryPipeline } from './helpers/event-category-pipeline.helper';
import { Types } from 'mongoose';

@Injectable()
export class EventCategoriesService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.EVENT_CATEGORY) private eventCategoryModel: IEventCategoryModel,
    @Inject(ModelNames.EVENT) private eventModel: IEventModel,
  ) {}

  async createEventCategory(adminId: string, body: CreateEventCategoryDto) {
    const { name } = body;

    if (
      await this.eventCategoryModel.exists({
        name,
      })
    ) {
      throw new ConflictException(errorManager.EVENT_CATEGORY_NOT_FOUND);
    }

    const newEventCategory = new this.eventCategoryModel(body);
    const savedEventCategory = await newEventCategory.save();

    return savedEventCategory;
  }

  async updateEventCategory(
    adminId: string,
    { eventCategoryId }: EventCategoryIdParamDto,
    body: UpdateEventCategoryDto,
  ) {
    const { name } = body;

    if (name && (await this.eventCategoryModel.exists({ _id: { $ne: eventCategoryId }, name }))) {
      throw new ConflictException(errorManager.EVENT_CATEGORY_NOT_FOUND);
    }

    const eventCategory = await this.eventCategoryModel.findById(eventCategoryId);
    if (!eventCategory) {
      throw new NotFoundException(errorManager.EVENT_CATEGORY_NOT_FOUND);
    }

    eventCategory.set(body);
    const savedEventCategory = await eventCategory.save();

    return savedEventCategory;
  }

  async deleteEventCategory(adminId: string, { eventCategoryId }: EventCategoryIdParamDto) {
    const eventCategory = await this.eventCategoryModel.findOne({ _id: eventCategoryId });

    if (!eventCategory) {
      throw new NotFoundException(errorManager.EVENT_CATEGORY_NOT_FOUND);
    }

    //TODO: update this when requirments change
    if (await this.eventModel.exists({ category: eventCategory._id })) {
      throw new ForbiddenException(errorManager.EVENT_CATEGORY_IN_USE_BY_EVENTS);
    }

    await eventCategory.deleteDoc();
  }

  async getEventCategories(adminId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<EventCategory>> {
    const { page, limit, search } = query;
    if (search) {
      return this.getSearchedTypes(query);
    }
    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.eventCategoryModel.aggregate(matchStage).count('total'),
      this.eventCategoryModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...getEventCategoryPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedTypes({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<EventCategory>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_EVENT_CATEGORIES_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.eventCategoryModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getEventCategoryPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getEventCategoryById(adminId: string, { eventCategoryId }: EventCategoryIdParamDto) {
    const [eventCategory] = await this.eventCategoryModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(eventCategoryId),
        },
      },
      ...getEventCategoryPipeline(),
    ]);
    if (!eventCategory) {
      throw new NotFoundException(errorManager.EVENT_CATEGORY_NOT_FOUND);
    }

    return eventCategory;
  }
}
