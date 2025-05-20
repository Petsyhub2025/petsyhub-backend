import { errorManager } from '@events/admin/shared/config/errors.config';
import { EventFacilityIdParamDto } from '@events/admin/shared/dto/event-facility-id-param.dto';
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
  EventFacility,
  IEventFacilityModel,
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
import { Types } from 'mongoose';
import { CreateEventFacilityDto } from './dto/create-event-facility.dto';
import { UpdateEventFacilityDto } from './dto/update-event-facility.dto';
import { getEventFacilityPipeline } from './helpers/event-facility-pipeline.helper';

@Injectable()
export class EventFacilitiesService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.EVENT_FACILITY) private eventFacilityModel: IEventFacilityModel,
    @Inject(ModelNames.EVENT) private eventModel: IEventModel,
  ) {}

  async createEventFacility(adminId: string, body: CreateEventFacilityDto) {
    const { name } = body;

    if (
      await this.eventFacilityModel.exists({
        name,
      })
    ) {
      throw new ConflictException(errorManager.EVENT_FACILITY_NOT_FOUND);
    }

    const newEventFacility = new this.eventFacilityModel(body);
    const savedEventFacility = await newEventFacility.save();

    return savedEventFacility;
  }

  async updateEventFacility(
    adminId: string,
    { eventFacilityId }: EventFacilityIdParamDto,
    body: UpdateEventFacilityDto,
  ) {
    const { name } = body;

    if (name && (await this.eventFacilityModel.exists({ _id: { $ne: eventFacilityId }, name }))) {
      throw new ConflictException(errorManager.EVENT_FACILITY_NOT_FOUND);
    }

    const eventFacility = await this.eventFacilityModel.findById(eventFacilityId);
    if (!eventFacility) {
      throw new NotFoundException(errorManager.EVENT_FACILITY_NOT_FOUND);
    }

    eventFacility.set(body);
    const savedEventFacility = await eventFacility.save();

    return savedEventFacility;
  }

  async deleteEventFacility(adminId: string, { eventFacilityId }: EventFacilityIdParamDto) {
    const eventFacility = await this.eventFacilityModel.findOne({ _id: eventFacilityId });

    if (!eventFacility) {
      throw new NotFoundException(errorManager.EVENT_FACILITY_NOT_FOUND);
    }

    //TODO: update this when requirments change
    if (await this.eventModel.exists({ facilities: { $in: [eventFacility._id] } })) {
      throw new ForbiddenException(errorManager.EVENT_FACILITY_IN_USE_BY_EVENTS);
    }

    await eventFacility.deleteDoc();
  }

  async getEventFacilities(adminId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<EventFacility>> {
    const { page, limit, search } = query;
    if (search) {
      return this.getSearchedTypes(query);
    }
    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.eventFacilityModel.aggregate(matchStage).count('total'),
      this.eventFacilityModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...getEventFacilityPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedTypes({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<EventFacility>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_EVENT_FACILITIES_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.eventFacilityModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getEventFacilityPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getEventFacilityById(adminId: string, { eventFacilityId }: EventFacilityIdParamDto) {
    const [eventFacility] = await this.eventFacilityModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(eventFacilityId),
        },
      },
      ...getEventFacilityPipeline(),
    ]);
    if (!eventFacility) {
      throw new NotFoundException(errorManager.EVENT_FACILITY_NOT_FOUND);
    }

    return eventFacility;
  }
}
