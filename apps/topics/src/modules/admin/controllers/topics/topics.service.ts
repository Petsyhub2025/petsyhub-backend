import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TopicIdParamDto } from './dto/topic-id-param.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ModelNames } from '@common/constants';
import { ITopicModel, MediaTypeEnum, MediaUploadService } from '@instapets-backend/common';
import { errorManager } from '@topics/admin/shared/config/errors.config';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
@Injectable()
export class TopicsService {
  constructor(
    @Inject(ModelNames.TOPIC) private readonly topicModel: ITopicModel,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async createTopic(adminId: string | Types.ObjectId, { name, icon }: CreateTopicDto) {
    if (await this.topicModel.findOne({ $or: [{ 'name.ar': name.ar }, { 'name.en': name.en }] })) {
      throw new ConflictException(errorManager.TOPIC_NAME_ALREADY_EXISTS);
    }
    const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
      files: [icon],
      filesS3PathPrefix: `topics`,
      resourceModel: {
        name: UploadModelResources.TOPIC_MEDIA,
      },
      allowedMediaTypes: [MediaTypeEnum.IMAGE],
      isUploadedByAdmin: true,
    });

    const newTopic = new this.topicModel();
    newTopic.set({
      name,
      icon: media[0],
      iconProcessingId: mediaProcessingId,
      creator: new Types.ObjectId(adminId),
    });
    await newTopic.save();

    const createdTopic = await this.topicModel
      .findById(newTopic._id, {
        _id: 1,
        name: 1,
        icon: 1,
        isViewable: 1,
      })
      .lean();

    return createdTopic;
  }

  async updateTopic(adminId: string | Types.ObjectId, { topicId }: TopicIdParamDto, { icon, name }: UpdateTopicDto) {
    const oldTopic = await this.topicModel.findById(topicId);
    if (!oldTopic) {
      throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
    }

    if (
      await this.topicModel.findOne({
        _id: { $ne: new Types.ObjectId(topicId) },
        $or: [{ 'name.ar': name.ar }, { 'name.en': name.en }],
      })
    ) {
      throw new ConflictException(errorManager.TOPIC_NAME_ALREADY_EXISTS);
    }

    if (icon) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [icon],
        filesS3PathPrefix: `topics`,
        resourceModel: {
          name: UploadModelResources.USER_PUSH_NOTIFICATION_MEDIA,
          ...(oldTopic.iconProcessingId && {
            mediaProcessingId: oldTopic.iconProcessingId,
          }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
        isUploadedByAdmin: true,
      });

      oldTopic.set({
        icon: media[0],
        iconProcessingId: mediaProcessingId,
      });
    }
    oldTopic.set({
      name,
    });

    await oldTopic.save();

    const topic = await this.topicModel
      .findById(oldTopic._id, {
        _id: 1,
        name: 1,
        icon: 1,
        isViewable: 1,
      })
      .lean();

    return topic;
  }

  async getTopics(adminId: string | Types.ObjectId) {
    return await this.topicModel.find({}, { name: 1, icon: 1, isViewable: 1 }).lean();
  }

  async getTopicById(adminId: string | Types.ObjectId, { topicId }: TopicIdParamDto) {
    const [topic] = await this.topicModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(topicId) },
      },
      {
        $lookup: {
          from: 'usertopics',
          let: { topicId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$topic', '$$topicId'],
                },
              },
            },
          ],
          as: 'userTopics',
        },
      },
      {
        $lookup: {
          from: 'posts',
          let: { topicId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$topicId', { $ifNull: ['$topics', []] }],
                },
              },
            },
          ],
          as: 'postTopics',
        },
      },
      {
        $lookup: {
          from: 'admins',
          let: { adminId: '$creator' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$adminId'],
                },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
              },
            },
          ],
          as: 'creator',
        },
      },
      {
        $unwind: {
          path: '$creator',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          icon: 1,
          creator: 1,
          createdAt: 1,
          updatedAt: 1,
          userInterestedCount: {
            $size: '$userTopics',
          },
          postSelectedCount: {
            $size: '$postTopics',
          },
          isViewable:1,
        },
      },
    ]);
    
    if (!topic) {
      throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
    }

    return topic;
  }

  async suspendTopic(adminId: string | Types.ObjectId, { topicId }: TopicIdParamDto) {
    const topic = await this.topicModel.findOne({ _id: new Types.ObjectId(topicId), isViewable: true });
    if (!topic) {
      throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
    }

    await topic.suspendDoc();
  }

  async unSuspendTopic(adminId: string | Types.ObjectId, { topicId }: TopicIdParamDto) {
    const topic = await this.topicModel.findOne({ _id: new Types.ObjectId(topicId), isViewable: false });
    if (!topic) {
      throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
    }

    await topic.unSuspendDoc();
  }
}
