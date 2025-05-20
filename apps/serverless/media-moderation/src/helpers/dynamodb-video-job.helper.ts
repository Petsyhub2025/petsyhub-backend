import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { RuntimeConfig } from '@serverless/common/classes/runtime-config.class';
import { IUploadFile } from '@serverless/media-moderation/interfaces/upload-file.interface';
import { DynamodbClient } from '@serverless/common/classes/dynamodb-client.class';
import { ResourceModelDto } from '@serverless/common/classes/validations/resource-model.class';
import { VideoJob } from '@serverless/common/interfaces/dynamo-db/video-job.interface';
import { JOB_EXPIRY_TIME } from '@serverless/media-moderation/constants';
import { Logger } from '@serverless/common/classes/logger.class';
import { VIDEO_MODERATION_JOBS_TABLE } from '@serverless/common/constants';

export async function createDynamodbVideoJobForUploadedFile({ processedFile, s3Key, uploadStatus }: IUploadFile) {
  try {
    const { isUploadedByAdmin } = RuntimeConfig.config;

    if (isUploadedByAdmin) {
      Logger.getInstance().log('Skipping creating video job as it was uploaded by admin', { s3Key });
      return;
    }

    const { jobId } = processedFile;

    if (!jobId) {
      throw new Error('Cannot create video job: Processed file does not have a jobId.');
    }

    const { resourceModel } = RuntimeConfig.config;

    const videoJob: Record<keyof VideoJob, AttributeValue> = {
      jobId: { S: jobId },
      s3Key: { S: s3Key },
      uploadStatus: { S: uploadStatus },
      resourceModel: {
        M: {
          name: { S: resourceModel.name },
          mediaProcessingId: { S: resourceModel.mediaProcessingId },
        } satisfies Record<keyof ResourceModelDto, AttributeValue>,
      },
      expiresAt: { N: Math.floor((Date.now() + JOB_EXPIRY_TIME) / 1000).toString() },
    };

    await DynamodbClient.getInstance().putItem(VIDEO_MODERATION_JOBS_TABLE, { Item: videoJob });
  } catch (error) {
    Logger.getInstance().error(`Error creating video job for file ${s3Key}: ${error.message}`, { error });
    throw error;
  }
}
