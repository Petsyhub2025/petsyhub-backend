import { ProcessedFileFormats } from '@serverless/common/enums/processed-file-formats.enum';
import { IModerationResult } from '@serverless/common/interfaces/media-moderation/moderation-result.interface';

interface IBaseProcessedFile {
  type: ProcessedFileFormats;
  moderationResult?: IModerationResult;
  jobId?: string;
  file: Buffer | Uint8Array;
}

export interface IProcessedNonGifImageFile extends IBaseProcessedFile {
  type: ProcessedFileFormats.WEBP;
  moderationResult: IModerationResult;
  jobId?: never;
}

// export interface IProcessedGifImageFile extends IBaseProcessedFile {
//   type: ProcessedFileFormats.GIF;
//   moderationResult?: never;
//   jobId?: never;
// }

export interface IProcessedVideoFile extends IBaseProcessedFile {
  type: ProcessedFileFormats.VIDEO;
  moderationResult?: never;
  jobId: string;
}

export interface IProcessedAudioFile extends IBaseProcessedFile {
  type: ProcessedFileFormats.AUDIO;
  moderationResult?: never;
  jobId?: never;
}

export type IProcessedFile =
  | IProcessedNonGifImageFile
  // | IProcessedGifImageFile
  | IProcessedVideoFile
  | IProcessedAudioFile;
