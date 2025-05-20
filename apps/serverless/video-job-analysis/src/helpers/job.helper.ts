import { DynamodbClient } from '@serverless/common/classes/dynamodb-client.class';
import { Logger } from '@serverless/common/classes/logger.class';
import { RekognitionClient } from '@serverless/common/classes/rekognition-client.class';
import { S3Client } from '@serverless/common/classes/s3-client.class';
import { VIDEO_MODERATION_JOBS_TABLE } from '@serverless/common/constants';
import { transformLabelsToModerationResult } from '@serverless/common/helpers/moderation.helper';
import { VideoJob } from '@serverless/common/interfaces/dynamo-db/video-job.interface';
import { IModerationResult } from '@serverless/common/interfaces/media-moderation/moderation-result.interface';
import { IJobCompletionEvent } from '@serverless/video-job-analysis/interfaces/job-completion.interface';
import { AttributeValue } from 'dynamodb-data-types';
import { sendToMsgHandler } from './send-to-msghandler.helper';
import { getVideoThumbnailS3KeyFromVideoKey } from './video.helper';
import { adjustVideoAndThumbnailMetadataInS3 } from './metadata.helper';

export async function processJobCompletionEvent(event: IJobCompletionEvent) {
  const { JobId, Status } = event;
  Logger.getInstance().log(`Processing job completion event for job ${JobId} with status ${Status}`);

  const dynamodbClient = DynamodbClient.getInstance();
  const dynamodbResponse = await dynamodbClient.getItem(VIDEO_MODERATION_JOBS_TABLE, {
    Key: {
      jobId: { S: JobId },
    },
  });

  if (!dynamodbResponse?.Item) {
    Logger.getInstance().error(`Job ${JobId} not found in the database`);
    throw new Error(`Job ${JobId} not found in the database`);
  }

  const job: VideoJob = AttributeValue.unwrap(dynamodbResponse.Item);

  Logger.getInstance().log(`Processing job ${JobId} with s3Key: ${job.s3Key}`, { job });

  const { s3Key, uploadStatus, resourceModel } = job;

  if (uploadStatus !== 'success') {
    Logger.getInstance().warn(`Job ${JobId} with ${s3Key} has already failed upload, skipping processing`);
    return;
  }

  const { isSuccess, isSensitiveContent } = await getContentModerationResults(JobId, job.s3Key);

  Logger.getInstance().log(`Moderation results for ${s3Key}`, {
    moderationResult: {
      isSuccess,
      isSensitiveContent,
    },
  });

  if (!isSuccess) {
    Logger.getInstance().error(`${s3Key} moderation failed, deleting content from S3`);
    await Promise.all([deleteVideoFromS3(s3Key), deleteVideoThumbnailFromS3(s3Key)]);
    return;
  }

  if (isSensitiveContent) {
    Logger.getInstance().log(`Sensitive content detected in ${s3Key}`);
    await Promise.all([
      sendToMsgHandler({
        s3Key,
        resourceModel,
      }),
      adjustVideoAndThumbnailMetadataInS3(s3Key, {
        isSensitiveContent,
      }),
    ]);
  }
}

async function getContentModerationResults(jobId: string, s3Key: string): Promise<IModerationResult> {
  const rekognitionClient = RekognitionClient.getInstance();
  const rekognitionResponse = await rekognitionClient.getContentModerationJobResults(jobId);

  if (!rekognitionResponse?.ModerationLabels) {
    throw new Error('Failed to get moderation labels');
  }

  const { ModerationLabels } = rekognitionResponse;

  const moderationLabels = ModerationLabels.map((label) => label.ModerationLabel);

  Logger.getInstance().log(`Moderation labels for ${s3Key}`, {
    moderationLabels,
  });

  return transformLabelsToModerationResult(moderationLabels);
}

async function deleteVideoFromS3(s3Key: string) {
  const s3Client = S3Client.getInstance();

  await s3Client.deleteObject(s3Key);
}

async function deleteVideoThumbnailFromS3(s3Key: string) {
  const s3Client = S3Client.getInstance();
  const thumbnailS3Key = getVideoThumbnailS3KeyFromVideoKey(s3Key);
  await s3Client.deleteObject(thumbnailS3Key);
}
