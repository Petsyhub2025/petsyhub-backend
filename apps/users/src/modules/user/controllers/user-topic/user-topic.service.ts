import { ModelNames } from '@common/constants';
import { ITopicModel, IUserModel, IUserTopicModel, Topic, UserTopic } from '@instapets-backend/common';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { errorManager } from '@users/user/shared/config/errors.config';
import { Connection, HydratedDocument, Types } from 'mongoose';
import { UpdateUserTopicDto } from './dto/update-user-topic.dto';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class UserTopicService {
  constructor(
    @Inject(ModelNames.USER_TOPIC) private readonly userTopicModel: IUserTopicModel,
    @Inject(ModelNames.USER) private readonly userModel: IUserModel,
    @Inject(ModelNames.TOPIC) private readonly topicModel: ITopicModel,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async updateUserTopics(userId: string | Types.ObjectId, { userTopics }: UpdateUserTopicDto) {
    const user = this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    // Check topics existence
    for (let i = 0; i < userTopics.length; i++) {
      if (!(await this.topicModel.findById(userTopics[i]))) {
        throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
      }
    }

    // Check duplications topics ids
    if (this.hasDuplicates(userTopics.map((userTopic) => userTopic.toString()))) {
      throw new BadRequestException(errorManager.TOPICS_DUPLICATED);
    }

    // Delete and update topics
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });
    try {
      await this.userTopicModel.deleteMany({ user: new Types.ObjectId(userId) }).session(session);

      for (let i = 0; i < userTopics.length; i++) {
        const userTopic = new this.userTopicModel();
        userTopic.set({
          user: new Types.ObjectId(userId),
          topic: new Types.ObjectId(userTopics[i]),
        });

        await userTopic.save({ session });
      }
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getUserTopics(userId: string | Types.ObjectId) {
    const userTopics = await this.userTopicModel.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'topics',
          let: { topicId: '$topic' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$topicId'],
                },
              },
            },
            {
              $project: {
                name: 1,
                icon: 1,
              },
            },
          ],
          as: 'topics',
        },
      },
      {
        $unwind: {
          path: '$topics',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                _id: '$topics._id',
                name: '$topics.name',
                icon: '$topics.icon',
              },
            ],
          },
        },
      },
    ]);

    return userTopics;
  }
  private hasDuplicates(userTopics: string[]) {
    return new Set(userTopics).size !== userTopics.length;
  }
}
