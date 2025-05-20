import { Inject, Injectable } from '@nestjs/common';
import { IEventCategoryModel, ModelNames } from '@instapets-backend/common';

@Injectable()
export class EventCategoriesService {
  constructor(@Inject(ModelNames.EVENT_CATEGORY) private readonly eventCategoryModel: IEventCategoryModel) {}

  async getEventCategories(userId: string) {
    const eventCategories = await this.eventCategoryModel.find({}, { _id: 1, name: 1 }).lean();
    return eventCategories;
  }
}
