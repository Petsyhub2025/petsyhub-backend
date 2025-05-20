import { MediaOrientationEnum } from '@common/schemas/mongoose/common/media/media.enum';

export interface IMediaMetadata {
  width?: number;
  height?: number;
  orientation?: MediaOrientationEnum;
  thumbnailUrl?: string;
}
