import { Logger } from '@serverless/common/classes/logger.class';
import { RekognitionClient } from '@serverless/common/classes/rekognition-client.class';
import { RuntimeConfig } from '@serverless/common/classes/runtime-config.class';
import { ProcessedFileFormats } from '@serverless/common/enums/processed-file-formats.enum';
import { IProcessedVideoFile } from '@serverless/media-moderation/interfaces/processed-file.interface';
import { getFfmpegMetadata } from './ffmpeg-meta.helper';
import { assertVideoMetadata } from './video-meta-assertion.helper';

export async function processVideo(s3Key: string, video: Uint8Array): Promise<IProcessedVideoFile> {
  await assertVideoMetadata(s3Key, video);

  const { isUploadedByAdmin } = RuntimeConfig.config;

  if (isUploadedByAdmin) {
    Logger.getInstance().log('Skipping video moderation as it was uploaded by admin', { s3Key });
    return {
      type: ProcessedFileFormats.VIDEO,
      file: video,
      jobId: null,
    };
  }

  const rekognitionClient = RekognitionClient.getInstance();
  const contentModerationResponse = await rekognitionClient.startVideoContentModerationAnalysisJob(s3Key);

  if (!contentModerationResponse?.JobId) {
    throw new Error('Failed to start video moderation job');
  }

  const { JobId } = contentModerationResponse;
  Logger.getInstance().log(`Video moderation job started for ${s3Key}`, { JobId, s3Key });

  return {
    type: ProcessedFileFormats.VIDEO,
    file: video,
    jobId: JobId,
  };
}

export async function isVideo(video: Uint8Array) {
  const videoMetadata = await getFfmpegMetadata(video);

  return videoMetadata?.streams?.length && videoMetadata?.streams?.some((stream) => stream.codec_type === 'video');
}
