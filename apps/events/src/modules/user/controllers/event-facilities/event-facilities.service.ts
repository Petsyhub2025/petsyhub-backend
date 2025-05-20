import { Inject, Injectable } from '@nestjs/common';
import { IEventFacilityModel, ModelNames } from '@instapets-backend/common';

@Injectable()
export class EventFacilitiesService {
  constructor(@Inject(ModelNames.EVENT_FACILITY) private readonly eventFacilityModel: IEventFacilityModel) {}

  async getEventFacilities(userId: string) {
    const eventFacilities = await this.eventFacilityModel.find({}, { _id: 1, name: 1 }).lean();
    return eventFacilities;
  }
}
