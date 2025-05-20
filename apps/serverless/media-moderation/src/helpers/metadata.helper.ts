import { MediaTypeEnum } from '@common/schemas/mongoose/common/media/media.enum';
import { Media } from '@common/schemas/mongoose/common/media/media.type';
import { Logger } from '@serverless/common/classes/logger.class';
import { ProcessedFileFormats } from '@serverless/common/enums/processed-file-formats.enum';
import { IMediaMetadata } from '@serverless/media-moderation/interfaces/media-metadata.inteface';
import { IProcessedNonGifImageFile } from '@serverless/media-moderation/interfaces/processed-file.interface';
import Ffmpeg from 'fluent-ffmpeg';
import { unlinkSync, writeFileSync } from 'fs';
import sharp from 'sharp';
import { PassThrough, Readable } from 'stream';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { getCloudFrontUrlForS3Key } from './cloudfront-url.helper';
import { getFfmpegMetadata } from './ffmpeg-meta.helper';
import { uploadFileToS3 } from './file.helper';
import { calculateOrientation } from './media.helper';

export async function getMediaMetadata(
  file: Buffer | Uint8Array,
  mediaType: MediaTypeEnum,
  s3Key: string,
): Promise<IMediaMetadata | null> {
  switch (mediaType) {
    case MediaTypeEnum.IMAGE:
      return getImageMetadata(file);
    case MediaTypeEnum.VIDEO:
      return getVideoMetadata(file, s3Key);
    default:
      return null;
  }
}

async function getImageMetadata(file: Buffer | Uint8Array): Promise<IMediaMetadata> {
  const { width, height } = await sharp(file).metadata();

  return {
    width,
    height,
    orientation: calculateOrientation(width, height),
  };
}

async function getVideoMetadata(file: Buffer | Uint8Array, s3Key: string): Promise<IMediaMetadata> {
  const videoMetadata = await getFfmpegMetadata(file);
  const videoStream = videoMetadata?.streams?.find((stream) => stream.codec_type === 'video');

  if (!videoStream) {
    throw new Error('[METADATA]: Invalid video stream');
  }

  const width = videoStream.width;
  const height = videoStream.height;
  const duration = parseFloat(videoStream.duration);
  const thumbnailUrl = await getVideoThumbnailUrl(file, duration, s3Key);

  return {
    width,
    height,
    orientation: calculateOrientation(width, height),
    thumbnailUrl,
  };
}

async function getVideoThumbnailUrl(video: Buffer | Uint8Array, videoDuration: number, s3Key: string): Promise<string> {
  const videoBuffer = Buffer.from(video, video.byteOffset, video.byteLength); // To avoid copying the buffer, instead re-use the same memory.
  // Generate a random filename for the video
  const filename = `${uuidV5(uuidV4(), uuidV4())}.mp4`;
  const filePath = `/tmp/${filename}`;
  writeFileSync(filePath, videoBuffer);

  try {
    const duration = videoDuration ?? 0;
    const seekTime = duration * 0.25; // Get the thumbnail at 25% of the video duration
    const ffmpegOutputStream = new PassThrough();

    Ffmpeg()
      .input(filePath)
      .seekInput(seekTime)
      .frames(1)
      .outputOptions([
        '-f image2', // Force the image output format to be PNG
        '-vcodec png',
      ])
      .on('error', (error) => {
        Logger.getInstance().error('Error processing video with FFMPEG', { error });
        ffmpegOutputStream.emit('error', error);
      })
      .pipe(ffmpegOutputStream);

    const thumbnailPngBuffer = await transformToByteArray(ffmpegOutputStream);

    if (!thumbnailPngBuffer?.byteLength) {
      throw new Error('Error processing video thumbnail, no data returned from FFmpeg');
    }

    const thumbnailWebpBuffer = await sharp(thumbnailPngBuffer).webp().toBuffer();
    const thumbnailWebpMetadata = await getImageMetadata(thumbnailWebpBuffer);

    const thumbnailWebpS3Key = s3Key.replace(/\.[^/.]+$/, '.webp');
    const thumbnailWebpCloudFrontUrl = getCloudFrontUrlForS3Key(thumbnailWebpS3Key);

    const uploadedMedia: Media = {
      ...thumbnailWebpMetadata,
      type: MediaTypeEnum.IMAGE,
      url: thumbnailWebpCloudFrontUrl,
    };

    const thumbnailProcessedFile: IProcessedNonGifImageFile = {
      file: thumbnailWebpBuffer,
      type: ProcessedFileFormats.WEBP,
      moderationResult: {
        isSuccess: true,
      },
    };

    await uploadFileToS3(thumbnailWebpS3Key, thumbnailProcessedFile, uploadedMedia);

    return thumbnailWebpCloudFrontUrl;
  } catch (error) {
    Logger.getInstance().error('Error generating video thumbnail', { error });
    throw error;
  } finally {
    // Clean up the temporary video file
    unlinkSync(filePath);
  }
}

export function transformToByteArray(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];

    stream.pipe(passThrough);

    passThrough.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    passThrough.on('error', (error) => {
      Logger.getInstance().error('Error transforming stream to byte array:', { error });
      reject(error);
    });

    passThrough.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}
