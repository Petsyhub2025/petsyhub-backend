import { AppConfig, CustomLoggerService, IChatMessageModel, IPostModel, ModelNames } from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import { UpdateSensitiveContentDto } from './dto/update-sensitive-content.dto';

@Injectable()
export class MediaModerationService {
  constructor(
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.CHAT_MESSAGE) private chatMessageModel: IChatMessageModel,
    private readonly logger: CustomLoggerService,
    private readonly appConfig: AppConfig,
  ) {}

  async updateSensitiveContent(data: UpdateSensitiveContentDto) {
    const { resourceModel } = data;
    switch (resourceModel.name) {
      case UploadModelResources.POSTS:
        await this.updatePostSensitiveContent(data);
        return;
      case UploadModelResources.CHAT_MESSAGE_MEDIA:
        await this.updateChatMessageSensitiveContent(data);
        return;
      default:
        this.logger.warn(`Resource model ${resourceModel.name} does not support sensitive video content update.`);
        return;
    }
  }

  private async updatePostSensitiveContent({ s3Key, resourceModel }: UpdateSensitiveContentDto) {
    const { mediaProcessingId } = resourceModel;
    const post = await this.postModel.findOne({ mediaProcessingId }).lean();

    if (!post) {
      this.logger.error(`Post with mediaProcessingId ${mediaProcessingId} not found.`);
      return;
    }

    await this.postModel.findOneAndUpdate(
      {
        _id: post._id,
        'media.url': this.getMediaUrl(s3Key),
      },
      {
        $set: {
          'media.$.isSensitiveContent': true,
        },
      },
    );
  }

  private async updateChatMessageSensitiveContent({ s3Key, resourceModel }: UpdateSensitiveContentDto) {
    const { mediaProcessingId } = resourceModel;
    const chatMessage = await this.chatMessageModel.findOne({ mediaProcessingId }).lean();

    if (!chatMessage) {
      this.logger.error(`Chat message with mediaProcessingId ${mediaProcessingId} not found.`);
      return;
    }

    await this.chatMessageModel.findOneAndUpdate(
      {
        _id: chatMessage._id,
        'media.url': this.getMediaUrl(s3Key),
      },
      {
        $set: {
          'media.$.isSensitiveContent': true,
        },
      },
    );
  }

  private getMediaUrl(s3Key: string) {
    return `${this.appConfig.MEDIA_DOMAIN}/${s3Key}`;
  }
}
