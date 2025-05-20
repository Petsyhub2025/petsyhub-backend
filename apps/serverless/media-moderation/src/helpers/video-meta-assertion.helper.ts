import { formatBytes } from '@serverless/common/helpers';
import {
  MAX_LANDSCAPE_VIDEO_HEIGHT,
  MAX_LANDSCAPE_VIDEO_WIDTH,
  MAX_PORTRAIT_VIDEO_HEIGHT,
  MAX_PORTRAIT_VIDEO_WIDTH,
  MAX_SQUARE_VIDEO_HEIGHT,
  MAX_SQUARE_VIDEO_WIDTH,
  MAX_VIDEO_DURATION_IN_SECONDS,
  MAX_VIDEO_SIZE,
  MIN_LANDSCAPE_VIDEO_HEIGHT,
  MIN_LANDSCAPE_VIDEO_WIDTH,
  MIN_PORTRAIT_VIDEO_HEIGHT,
  MIN_PORTRAIT_VIDEO_WIDTH,
  MIN_SQUARE_VIDEO_HEIGHT,
  MIN_SQUARE_VIDEO_WIDTH,
  MIN_VIDEO_DURATION_IN_SECONDS,
} from '@serverless/media-moderation/constants';
import { getFfmpegMetadata } from './ffmpeg-meta.helper';
import { assertFileAspectRatio } from './file.helper';
import { MediaOrientationEnum } from '@common/schemas/mongoose/common/media/media.enum';
import { calculateOrientation } from './media.helper';

export async function assertVideoMetadata(key: string, video: Uint8Array) {
  const videoMetadata = await getFfmpegMetadata(video);

  if (!videoMetadata?.streams?.length) {
    throw new Error(`Video file ${key}: Invalid video file`);
  }

  const videoStream = videoMetadata.streams.find((stream) => stream.codec_type === 'video');

  if (!videoStream) {
    throw new Error(`Video file ${key}: Invalid video stream`);
  }

  const duration = parseFloat(videoStream.duration);

  if (isNaN(duration) || duration <= 0) {
    throw new Error(`Video file ${key}: Invalid video duration`);
  }

  if (duration < MIN_VIDEO_DURATION_IN_SECONDS) {
    throw new Error(
      `Video file ${key}: Video duration is less than the minimum limit: ${MIN_VIDEO_DURATION_IN_SECONDS} seconds`,
    );
  }

  if (duration > MAX_VIDEO_DURATION_IN_SECONDS) {
    throw new Error(
      `Video file ${key}: Video duration exceeds the maximum limit: ${MAX_VIDEO_DURATION_IN_SECONDS} seconds`,
    );
  }

  const videoSizeInBytes = video.byteLength;

  if (videoSizeInBytes > MAX_VIDEO_SIZE) {
    throw new Error(`Video file ${key}: Video size exceeds the maximum limit: ${formatBytes(MAX_VIDEO_SIZE)}`);
  }

  const width = videoStream.width;
  const height = videoStream.height;

  if (!width || !height || isNaN(width) || isNaN(height)) {
    throw new Error(`Video file ${key}: Video width or height not found`);
  }

  const orientation = calculateOrientation(width, height);
  assertVideoDimensionsPerOrientation(key, width, height, orientation);
  assertFileAspectRatio(key, width, height);

  return videoStream;
}

function assertVideoDimensionsPerOrientation(
  key: string,
  width: number,
  height: number,
  orientation: MediaOrientationEnum,
) {
  switch (orientation) {
    case MediaOrientationEnum.PORTRAIT:
      assertPortraitVideoDimensions(key, width, height);
      break;
    case MediaOrientationEnum.LANDSCAPE:
      assertLandScapeVideoDimensions(key, width, height);
      break;
    case MediaOrientationEnum.SQUARE:
      assertSquareVideoDimensions(key, width, height);
      break;
    default:
      throw new Error('Invalid video orientation');
  }
}

function assertPortraitVideoDimensions(key: string, width: number, height: number) {
  if (width < MIN_PORTRAIT_VIDEO_WIDTH) {
    throw new Error(
      `Video file ${key}: Video width is less than the minimum limit for portrait orientation: ${MIN_PORTRAIT_VIDEO_WIDTH}`,
    );
  } else if (width > MAX_PORTRAIT_VIDEO_WIDTH) {
    throw new Error(
      `Video file ${key}: Video width exceeds the maximum limit for portrait orientation: ${MAX_PORTRAIT_VIDEO_WIDTH}`,
    );
  } else if (height < MIN_PORTRAIT_VIDEO_HEIGHT) {
    throw new Error(
      `Video file ${key}: Video height is less than the minimum limit for portrait orientation: ${MIN_PORTRAIT_VIDEO_HEIGHT}`,
    );
  } else if (height > MAX_PORTRAIT_VIDEO_HEIGHT) {
    throw new Error(
      `Video file ${key}: Video height exceeds the maximum limit for portrait orientation: ${MAX_PORTRAIT_VIDEO_HEIGHT}`,
    );
  }
}

function assertLandScapeVideoDimensions(key: string, width: number, height: number) {
  if (width < MIN_LANDSCAPE_VIDEO_WIDTH) {
    throw new Error(
      `Video file ${key}: Video width is less than the minimum limit for landscape orientation: ${MIN_LANDSCAPE_VIDEO_WIDTH}`,
    );
  } else if (width > MAX_LANDSCAPE_VIDEO_WIDTH) {
    throw new Error(
      `Video file ${key}: Video width exceeds the maximum limit for landscape orientation: ${MAX_LANDSCAPE_VIDEO_WIDTH}`,
    );
  } else if (height < MIN_LANDSCAPE_VIDEO_HEIGHT) {
    throw new Error(
      `Video file ${key}: Video height is less than the minimum limit for landscape orientation: ${MIN_LANDSCAPE_VIDEO_HEIGHT}`,
    );
  } else if (height > MAX_LANDSCAPE_VIDEO_HEIGHT) {
    throw new Error(
      `Video file ${key}: Video height exceeds the maximum limit for landscape orientation: ${MAX_LANDSCAPE_VIDEO_HEIGHT}`,
    );
  }
}

function assertSquareVideoDimensions(key: string, width: number, height: number) {
  if (width < MIN_SQUARE_VIDEO_HEIGHT) {
    throw new Error(
      `Video file ${key}: Video width is less than the minimum limit for square orientation: ${MIN_SQUARE_VIDEO_HEIGHT}`,
    );
  } else if (width > MAX_SQUARE_VIDEO_HEIGHT) {
    throw new Error(
      `Video file ${key}: Video width exceeds the maximum limit for square orientation: ${MAX_SQUARE_VIDEO_HEIGHT}`,
    );
  } else if (height < MIN_SQUARE_VIDEO_WIDTH) {
    throw new Error(
      `Video file ${key}: Video height is less than the minimum limit for square orientation: ${MIN_SQUARE_VIDEO_WIDTH}`,
    );
  } else if (height > MAX_SQUARE_VIDEO_WIDTH) {
    throw new Error(
      `Video file ${key}: Video height exceeds the maximum limit for square orientation: ${MAX_SQUARE_VIDEO_WIDTH}`,
    );
  }
}
