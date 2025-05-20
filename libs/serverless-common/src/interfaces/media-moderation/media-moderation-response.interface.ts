import { Media } from '@common/schemas/mongoose/common/media/media.type';

export interface IMediaModerationResponse {
  mediaProcessingId: string;
  mediaFiles: Media[];
}
