import { MediaUploadFile } from '@common/schemas/mongoose/common/media/media-upload-file.type';
import { MediaTypeEnum } from '@common/schemas/mongoose/common/media/media.enum';
import { Logger } from '@serverless/common/classes/logger.class';
import { RuntimeConfig } from '@serverless/common/classes/runtime-config.class';
import { S3Client } from '@serverless/common/classes/s3-client.class';
import { ProcessedFileFormats } from '@serverless/common/enums/processed-file-formats.enum';
import {
  MAX_ASPECT_RATIO_DIFFERENCE,
  SUPPORTED_ASPECT_RATIOS,
  SUPPORTED_AUDIO_FORMATS,
} from '@serverless/media-moderation/constants';
import { IProcessedFile } from '@serverless/media-moderation/interfaces/processed-file.interface';
import { isAudio } from './audio.helper';
import { isImage, processImage } from './image.helper';
import { isVideo, processVideo } from './video.helper';
import { Media } from '@common/schemas/mongoose/common/media/media.type';
import { validateClass } from '@serverless/common/helpers';
import { calculateAspectRatio } from './media.helper';

export async function processFile({ type, s3Key }: MediaUploadFile): Promise<IProcessedFile> {
  const s3Client = S3Client.getInstance();

  const file = await s3Client.getObjectFromTempBucket(s3Key);

  if (!file) {
    throw new Error('File not found');
  }

  const isImageFile = await isImage(file);

  if (isImageFile && type !== MediaTypeEnum.IMAGE) {
    throw new Error('Invalid image file type');
  }

  if (isImageFile && !isMediaTypeAllowed(MediaTypeEnum.IMAGE)) {
    throw new Error('Image file type is not allowed');
  }

  if (isImageFile) return processImage(s3Key, file);

  const [isVideoCodecFile, isAudioCodecFile] = await Promise.all([isVideo(file), isAudio(file)]);

  const isVideoFile = !isImageFile && !isAudioCodecFile && isVideoCodecFile;
  const isAudioFile = !isImageFile && !isVideoFile && isAudioCodecFile;

  if (isVideoFile && type !== MediaTypeEnum.VIDEO) {
    throw new Error('Invalid video file type');
  }

  if (isVideoFile && !isMediaTypeAllowed(MediaTypeEnum.VIDEO)) {
    throw new Error('Video file type is not allowed');
  }

  if (isVideoFile) return processVideo(s3Key, file);

  if (isAudioFile && type !== MediaTypeEnum.AUDIO) {
    throw new Error('Invalid audio file type');
  }

  if (isAudioFile && !isMediaTypeAllowed(MediaTypeEnum.AUDIO)) {
    throw new Error('Audio file type is not allowed');
  }

  if (isAudioFile) {
    return {
      type: ProcessedFileFormats.AUDIO,
      file,
    };
  }

  throw new Error('Invalid file type');
}

export async function assertMediaFromCloudFrontUrl(media: Media) {
  try {
    await validateClass(media, Media);
  } catch (error) {
    Logger.getInstance().error(`Invalid media from cloudfront url`, { media });
    throw new Error('Invalid media from cloudfront url');
  }

  if (!isMediaTypeAllowed(media.type)) {
    Logger.getInstance().error(`Media type from cloudfront url ${media.url} not allowed: ${media.type}`, { media });
    throw new Error(`Media type from cloudfront url ${media.url} not allowed: ${media.type}`);
  }

  if (media.type !== MediaTypeEnum.IMAGE && media.type !== MediaTypeEnum.VIDEO) {
    return;
  }

  const { multiMediaAspectRatio } = RuntimeConfig.config;
  const aspectRatio = calculateAspectRatio(media.width, media.height);
  if (!multiMediaAspectRatio) {
    RuntimeConfig.set({ multiMediaAspectRatio: aspectRatio });
    return;
  }

  // Get the difference between the aspect ratios, if within 0.1 then it's considered the same
  const aspectRatioDifference = Math.abs(multiMediaAspectRatio - aspectRatio);
  if (aspectRatioDifference > MAX_ASPECT_RATIO_DIFFERENCE) {
    Logger.getInstance().error(
      `Aspect ratio mismatch for media url: ${media.url} & type: ${media.type}, expected ${multiMediaAspectRatio} got ${aspectRatio}`,
      { media },
    );
    throw new Error(
      `Aspect ratio mismatch for CloudFront media url: ${media.url}, expected ${multiMediaAspectRatio} got ${aspectRatio}`,
    );
  }
}

export function assertFileAspectRatio(key: string, width: number, height: number) {
  if (!width || !height || isNaN(width) || isNaN(height)) {
    Logger.getInstance().error(`Failed to calculate aspect ratio for file key: ${key}. Width and height are required`, {
      key,
      width,
      height,
    });
    throw new Error(`Failed to calculate aspect ratio for file key: ${key}. Width and height are required`);
  }

  const { multiMediaAspectRatio } = RuntimeConfig.config;

  const aspectRatio = calculateAspectRatio(width, height);
  let aspectRatioMatched = false;
  for (const ratio of SUPPORTED_ASPECT_RATIOS) {
    const difference = Math.abs(ratio - aspectRatio);
    if (difference < MAX_ASPECT_RATIO_DIFFERENCE) {
      aspectRatioMatched = true;
      break;
    }
  }

  if (!aspectRatioMatched) {
    Logger.getInstance().error(
      `Aspect ratio not supported for file key: ${key}, expected ${SUPPORTED_ASPECT_RATIOS.join(
        ', ',
      )} got ${aspectRatio}`,
      { key, width, height },
    );
    throw new Error(
      `Aspect ratio not supported for file key: ${key}, expected ${SUPPORTED_ASPECT_RATIOS.join(
        ', ',
      )} got ${aspectRatio}`,
    );
  }

  if (!multiMediaAspectRatio) {
    RuntimeConfig.set({ multiMediaAspectRatio: aspectRatio });
    return;
  }

  // Get the difference between the aspect ratios, if within 0.1 then it's considered the same
  const aspectRatioDifference = Math.abs(multiMediaAspectRatio - aspectRatio);
  if (aspectRatioDifference > MAX_ASPECT_RATIO_DIFFERENCE) {
    Logger.getInstance().error(
      `Aspect ratio mismatch for file key: ${key}, expected ${multiMediaAspectRatio} got ${aspectRatio}`,
      { key, width, height },
    );
    throw new Error(`Aspect ratio mismatch for file key: ${key}, expected ${multiMediaAspectRatio} got ${aspectRatio}`);
  }
}

export function getProcessedFileKey(currentS3Key: string, processedFile: IProcessedFile) {
  let filename = currentS3Key.split('/').pop();

  switch (processedFile.type) {
    // case ProcessedFileFormats.GIF:
    case ProcessedFileFormats.AUDIO:
    case ProcessedFileFormats.VIDEO:
      break;
    case ProcessedFileFormats.WEBP:
      filename = filename.replace(/\.[^/.]+$/, '.webp');
      break;
    default:
      throw new Error('Invalid processed file type');
  }

  const { filesS3PathPrefix } = RuntimeConfig.config;

  return `${filesS3PathPrefix}/${filename}`;
}

export async function uploadFileToS3(key: string, processedFile: IProcessedFile, metadata?: Media) {
  const s3Client = S3Client.getInstance();

  return s3Client.putObject(key, processedFile.file, processedFile.type);
}

export function getMediaTypeFromCloudFrontUrl(cloudFrontUrl: string): MediaTypeEnum {
  const extension = getFormatFromCloudFrontUrl(cloudFrontUrl);

  if (extension === 'webp') return MediaTypeEnum.IMAGE;
  if (extension === 'gif') return MediaTypeEnum.GIF;
  if (extension === 'mp4') return MediaTypeEnum.VIDEO;
  if (SUPPORTED_AUDIO_FORMATS.includes(extension)) return MediaTypeEnum.AUDIO;

  throw new Error('Invalid file extension');
}

export function getMediaTypeFromProcessedFileFormat(type: ProcessedFileFormats): MediaTypeEnum {
  switch (type) {
    case ProcessedFileFormats.WEBP:
      return MediaTypeEnum.IMAGE;
    // case ProcessedFileFormats.GIF:
    //   return MediaTypeEnum.GIF;
    case ProcessedFileFormats.VIDEO:
      return MediaTypeEnum.VIDEO;
    case ProcessedFileFormats.AUDIO:
      return MediaTypeEnum.AUDIO;
    default:
      throw new Error('Invalid processed file type');
  }
}

function getFormatFromCloudFrontUrl(cloudFrontUrl: string) {
  const url = new URL(cloudFrontUrl);
  const filename = url.pathname.split('/').pop();

  return filename.split('.').pop();
}

export function getS3KeyFromCloudFrontUrl(cloudFrontUrl: string) {
  return cloudFrontUrl.replace(`${process.env.MEDIA_DOMAIN}/`, '');
}

function isMediaTypeAllowed(type: MediaTypeEnum) {
  const { allowedMediaTypes } = RuntimeConfig.config;

  return allowedMediaTypes.includes(type);
}
