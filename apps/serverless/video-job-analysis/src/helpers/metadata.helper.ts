import { Media } from '@common/schemas/mongoose/common/media/media.type';
import { Logger } from '@serverless/common/classes/logger.class';
import { S3Client } from '@serverless/common/classes/s3-client.class';
import { parseS3Metadata } from '@serverless/common/helpers';
import { getVideoThumbnailS3KeyFromVideoKey } from './video.helper';

export async function adjustVideoAndThumbnailMetadataInS3(s3Key: string, metadata: Partial<Media>) {
  const thumbnailS3Key = getVideoThumbnailS3KeyFromVideoKey(s3Key);
  const [videoMetadata, thumbnailMetadata] = await Promise.all([
    getMediaObjectFromS3Metadata(s3Key),
    getMediaObjectFromS3Metadata(thumbnailS3Key),
  ]);

  const updatedVideoMetadata = {
    ...videoMetadata,
    ...metadata,
  };
  const updatedThumbnailMetadata = {
    ...thumbnailMetadata,
    ...metadata,
  };

  const s3Client = S3Client.getInstance();
  await Promise.all([
    s3Client.updateObjectMetadata(s3Key, updatedVideoMetadata),
    s3Client.updateObjectMetadata(thumbnailS3Key, updatedThumbnailMetadata),
  ]);
}

async function getMediaObjectFromS3Metadata(s3Key: string) {
  const s3Client = S3Client.getInstance();
  const s3Metadata = await s3Client.getObjectMetadata(s3Key);

  if (!s3Metadata || !s3Metadata?.Metadata) {
    Logger.getInstance().error(`Failed to get S3 metadata for key: ${s3Key}`);
    throw new Error(`Failed to get S3 metadata for key: ${s3Key}`);
  }

  const { Metadata } = s3Metadata;
  const metadata = parseS3Metadata<Media>(Metadata);

  return metadata;
}
