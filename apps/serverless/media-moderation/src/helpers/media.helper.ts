import { MediaOrientationEnum } from '@common/schemas/mongoose/common/media/media.enum';
import { Media } from '@common/schemas/mongoose/common/media/media.type';
import { Logger } from '@serverless/common/classes/logger.class';
import { S3Client } from '@serverless/common/classes/s3-client.class';
import { parseS3Metadata } from '@serverless/common/helpers';
import { getS3KeyFromCloudFrontUrl } from './file.helper';

export function calculateOrientation(width: number, height: number): MediaOrientationEnum {
  if (!width || !height || isNaN(width) || isNaN(height)) {
    throw new Error('Width and height are required to calculate orientation');
  }

  if (width > height) {
    return MediaOrientationEnum.LANDSCAPE;
  }

  if (width < height) {
    return MediaOrientationEnum.PORTRAIT;
  }

  return MediaOrientationEnum.SQUARE;
}

export function calculateAspectRatio(width: number, height: number): number {
  if (!width || !height || isNaN(width) || isNaN(height)) {
    throw new Error('Width and height are required to calculate aspect ratio');
  }

  return width / height;
}

export async function getMediaObjectFromS3Metadata(cloudFrontUrl: string) {
  const s3Key = getS3KeyFromCloudFrontUrl(cloudFrontUrl);
  const s3Client = S3Client.getInstance();
  const s3Metadata = await s3Client.getObjectMetadata(s3Key);

  if (!s3Metadata || !s3Metadata?.Metadata) {
    Logger.getInstance().error(`Failed to get S3 metadata for key: ${s3Key} & cloudFrontUrl: ${cloudFrontUrl}`);
    throw new Error(`Failed to get S3 metadata for url: ${cloudFrontUrl}`);
  }

  const { Metadata } = s3Metadata;
  const metadata = parseS3Metadata<Media>(Metadata);

  return getMediaAdjustedKeysFromS3Metadata(metadata);
}

function getMediaAdjustedKeysFromS3Metadata(metadata: object) {
  const camelCaseKeys: Map<string, string> = new Map<string, keyof Media>([
    ['playbackurl', 'playbackUrl'],
    ['issensitivecontent', 'isSensitiveContent'],
  ]);

  const media = Object.entries(metadata).reduce<Media>((acc, [key, value]) => {
    const camelCaseKey = camelCaseKeys.get(key.toLowerCase());
    if (camelCaseKey) {
      acc[camelCaseKey] = value;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {} as Media);

  return media;
}
