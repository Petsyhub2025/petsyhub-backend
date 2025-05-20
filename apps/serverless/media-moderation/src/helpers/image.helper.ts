import { Logger } from '@serverless/common/classes/logger.class';
import { RekognitionClient } from '@serverless/common/classes/rekognition-client.class';
import { RuntimeConfig } from '@serverless/common/classes/runtime-config.class';
import { ProcessedFileFormats } from '@serverless/common/enums/processed-file-formats.enum';
import { transformLabelsToModerationResult } from '@serverless/common/helpers/moderation.helper';
import { IProcessedNonGifImageFile } from '@serverless/media-moderation/interfaces/processed-file.interface';
import sharp from 'sharp';
import { assertImageMetadata } from './image-meta-assertion.helper';

export async function processImage(key: string, image: Uint8Array): Promise<IProcessedNonGifImageFile> {
  await assertImageMetadata(key, image);

  // if (format === 'gif') {
  //   return {
  //     type: ProcessedFileFormats.GIF,
  //     file: image,
  //   };
  // }

  let processedImage: IProcessedNonGifImageFile = {
    type: ProcessedFileFormats.WEBP,
    file: image,
    moderationResult: {
      isSuccess: true,
    },
  };
  const config = RuntimeConfig.config;

  if (!config?.isUploadedByAdmin) {
    const moderationResult = await detectImageModerationLabels(key);

    processedImage.moderationResult = moderationResult;
  }

  const webpImage = await convertImageToWebp(image);

  processedImage.file = webpImage;

  return processedImage;
}

export async function detectImageModerationLabels(s3Key: string) {
  const rekognitionClient = RekognitionClient.getInstance();
  const detectModerationLabelsResponse = await rekognitionClient.detectImageModerationLabelsFromS3(s3Key);

  if (!detectModerationLabelsResponse?.ModerationLabels) {
    throw new Error('Failed to detect moderation labels');
  }

  const { ModerationLabels } = detectModerationLabelsResponse;

  Logger.getInstance().log(`Moderation labels for ${s3Key}`, {
    ModerationLabels,
  });

  return transformLabelsToModerationResult(ModerationLabels);
}

export async function isImage(image: Uint8Array) {
  try {
    await sharp(image).metadata();
    return true;
  } catch (error) {
    return false;
  }
}

export async function convertImageToWebp(image: Uint8Array): Promise<Buffer> {
  try {
    const webpImage = await sharp(image).webp().toBuffer();
    return webpImage;
  } catch (error) {
    Logger.getInstance().error(`Error converting image to WebP: ${error.message}`, { error });
    throw error;
  }
}
