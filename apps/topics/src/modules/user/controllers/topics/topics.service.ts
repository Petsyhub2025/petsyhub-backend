import { ModelNames } from '@common/constants';
import { ITopicModel } from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class TopicsService {
  constructor(@Inject(ModelNames.TOPIC) private readonly topicModel: ITopicModel) {}

  async getTopics(userId: string | Types.ObjectId) {
    return await this.topicModel.find({}, { _id: 1, name: 1, icon: 1 }).lean();
  }
}
