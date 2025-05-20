import { MediaTypeEnum } from '@common/schemas/mongoose/common/media/media.enum';
import { Media } from '@common/schemas/mongoose/common/media/media.type';
import { Logger } from '@serverless/common/classes/logger.class';
import { RuntimeConfig } from '@serverless/common/classes/runtime-config.class';
import { MediaModerationLambdaEvent } from '@serverless/common/classes/validations/media-moderation-lambda-event.class';
import { IUploadFile } from '@serverless/media-moderation/interfaces/upload-file.interface';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { IProcessedFile } from '../interfaces/processed-file.interface';
import { getCloudFrontUrlForS3Key } from './cloudfront-url.helper';
import { createDynamodbVideoJobForUploadedFile } from './dynamodb-video-job.helper';
import {
  assertMediaFromCloudFrontUrl,
  getMediaTypeFromProcessedFileFormat,
  getProcessedFileKey,
  processFile,
  uploadFileToS3,
} from './file.helper';
import { getMediaMetadata } from './metadata.helper';
import { getMediaObjectFromS3Metadata } from './media.helper';

export async function processPayload(payload: MediaModerationLambdaEvent) {
  const { files, isUploadedByAdmin, filesS3PathPrefix, resourceModel, allowedMediaTypes } = payload;
  const { mediaProcessingId: _mediaProcessingId } = resourceModel;

  const mediaProcessingId = _mediaProcessingId || uuidV5(uuidV4(), uuidV4());

  RuntimeConfig.set({
    isUploadedByAdmin,
    filesS3PathPrefix,
    resourceModel: {
      mediaProcessingId: mediaProcessingId,
      name: resourceModel.name,
    },
    allowedMediaTypes,
  });

  try {
    let filesToUpload: { [key: string]: IUploadFile } = {};
    const mediaFiles: Media[] = [];

    for (const file of files) {
      if (file.url) {
        const media = await getMediaObjectFromS3Metadata(file.url);
        await assertMediaFromCloudFrontUrl(media);

        mediaFiles.push(media);
        continue;
      }

      const processedFile = await processFile(file);

      if (processedFile?.moderationResult?.isSuccess === false) {
        Logger.getInstance().error(`File ${file.s3Key} was flagged as inappropriate`, {
          file,
          moderationResult: processedFile.moderationResult,
        });
        throw new Error(`File ${file.s3Key} was flagged as inappropriate`);
      }

      const fileKey = getProcessedFileKey(file.s3Key, processedFile);
      const media = await getMediaObjectFromProcessedFile(processedFile, fileKey);

      filesToUpload[fileKey] = { s3Key: fileKey, processedFile, media };
    }

    for (const key in filesToUpload) {
      const { s3Key, processedFile, media } = filesToUpload[key];
      mediaFiles.push(media);

      const uploadResult = await uploadFileToS3(s3Key, processedFile, media);
      console.log(`Processed and uploaded: ${s3Key}`, { uploadResult, processedFile });

      if (!processedFile.jobId) continue;

      filesToUpload[key].uploadStatus = uploadResult ? 'success' : 'failed';
      await createDynamodbVideoJobForUploadedFile(filesToUpload[key]);
    }

    return {
      mediaProcessingId,
      mediaFiles,
    };
  } catch (error) {
    Logger.getInstance().error(`Error processing files from S3: ${error.message}`, { error });
    throw error;
  } finally {
    RuntimeConfig.set({
      multiMediaAspectRatio: null,
    });
  }
}

async function getMediaObjectFromProcessedFile(processedFile: IProcessedFile, s3Key: string) {
  const { moderationResult, file } = processedFile;
  const mediaType = getMediaTypeFromProcessedFileFormat(processedFile.type);
  const mediaMetadata = await getMediaMetadata(file, mediaType, s3Key);
  const media: Media = {
    type: mediaType,
    url: getCloudFrontUrlForS3Key(s3Key),
    ...(moderationResult && { isSensitiveContent: moderationResult.isSensitiveContent }),
    ...mediaMetadata,
  };

  if (mediaType === MediaTypeEnum.VIDEO) {
    const thumbnailUrl = mediaMetadata.thumbnailUrl;

    if (!thumbnailUrl) {
      Logger.getInstance().error(`Failed to get thumbnail URL for video: ${s3Key}`, { media });
      throw new Error(`Failed to get thumbnail URL for video: ${s3Key}`);
    }

    media.playbackUrl = thumbnailUrl;
    media.url = media.url;
  }

  return media;
}
