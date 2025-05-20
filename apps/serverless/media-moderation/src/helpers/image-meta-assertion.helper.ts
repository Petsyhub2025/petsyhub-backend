import {
  MAX_IMAGE_SIZE,
  MAX_LANDSCAPE_IMAGE_HEIGHT,
  MAX_LANDSCAPE_IMAGE_WIDTH,
  MAX_PORTRAIT_IMAGE_HEIGHT,
  MAX_PORTRAIT_IMAGE_WIDTH,
  MAX_SQUARE_IMAGE_HEIGHT,
  MAX_SQUARE_IMAGE_WIDTH,
  MIN_IMAGE_SIZE,
  MIN_LANDSCAPE_IMAGE_HEIGHT,
  MIN_LANDSCAPE_IMAGE_WIDTH,
  MIN_PORTRAIT_IMAGE_HEIGHT,
  MIN_PORTRAIT_IMAGE_WIDTH,
  MIN_SQUARE_IMAGE_HEIGHT,
  MIN_SQUARE_IMAGE_WIDTH,
} from '@serverless/media-moderation/constants';
import { AllowedImageFormats } from '@serverless/media-moderation/enums/image-formats.enum';
import { Logger } from '@serverless/common/classes/logger.class';
import { formatBytes } from '@serverless/common/helpers';
import sharp from 'sharp';
import { assertFileAspectRatio } from './file.helper';
import { calculateOrientation } from './media.helper';
import { MediaOrientationEnum } from '@common/schemas/mongoose/common/media/media.enum';

export async function assertImageMetadata(key: string, image: Uint8Array) {
  try {
    const imageMetadata = await sharp(image).metadata();

    if (!imageMetadata.format) {
      throw new Error(`Image file ${key}: Format not found`);
    }

    if (!Object.values(AllowedImageFormats).includes(imageMetadata.format as AllowedImageFormats)) {
      throw new Error(
        `Image file ${key}: Invalid format: ${imageMetadata.format}. Allowed formats: ${Object.values(
          AllowedImageFormats,
        ).join(', ')}}`,
      );
    }

    if (image.byteLength > MAX_IMAGE_SIZE) {
      throw new Error(`Image file ${key}: Image size exceeds the maximum limit: ${formatBytes(MAX_IMAGE_SIZE)}`);
    }

    if (image.byteLength < MIN_IMAGE_SIZE) {
      throw new Error(`Image file ${key}: Image size is less than the minimum limit: ${formatBytes(MIN_IMAGE_SIZE)}`);
    }

    const width = imageMetadata.width;
    const height = imageMetadata.height;

    if (!width || !height || isNaN(width) || isNaN(height)) {
      throw new Error(`Image file ${key}: Image width or height not found`);
    }

    const orientation = calculateOrientation(width, height);
    assertImageDimensionsPerOrientation(key, width, height, orientation);
    assertFileAspectRatio(key, width, height);

    return imageMetadata;
  } catch (error) {
    Logger.getInstance().error(`Error asserting image metadata: ${error.message}`, { error });
    throw error;
  }
}

function assertImageDimensionsPerOrientation(
  key: string,
  width: number,
  height: number,
  orientation: MediaOrientationEnum,
) {
  switch (orientation) {
    case MediaOrientationEnum.PORTRAIT:
      assertPortraitImageDimensions(key, width, height);
      break;
    case MediaOrientationEnum.LANDSCAPE:
      assertLandScapeImageDimensions(key, width, height);
      break;
    case MediaOrientationEnum.SQUARE:
      assertSquareImageDimensions(key, width, height);
      break;
    default:
      throw new Error('Invalid image orientation');
  }
}

function assertPortraitImageDimensions(key: string, width: number, height: number) {
  if (width < MIN_PORTRAIT_IMAGE_WIDTH) {
    throw new Error(
      `Image file ${key}: Image width is less than the minimum limit for portrait orientation: ${MIN_PORTRAIT_IMAGE_WIDTH}`,
    );
  } else if (width > MAX_PORTRAIT_IMAGE_WIDTH) {
    throw new Error(
      `Image file ${key}: Image width exceeds the maximum limit for portrait orientation: ${MAX_PORTRAIT_IMAGE_WIDTH}`,
    );
  } else if (height < MIN_PORTRAIT_IMAGE_HEIGHT) {
    throw new Error(
      `Image file ${key}: Image height is less than the minimum limit for portrait orientation: ${MIN_PORTRAIT_IMAGE_HEIGHT}`,
    );
  } else if (height > MAX_PORTRAIT_IMAGE_HEIGHT) {
    throw new Error(
      `Image file ${key}: Image height exceeds the maximum limit for portrait orientation: ${MAX_PORTRAIT_IMAGE_HEIGHT}`,
    );
  }
}

function assertLandScapeImageDimensions(key: string, width: number, height: number) {
  if (width < MIN_LANDSCAPE_IMAGE_WIDTH) {
    throw new Error(
      `Image file ${key}: Image width is less than the minimum limit for landscape orientation: ${MIN_LANDSCAPE_IMAGE_WIDTH}`,
    );
  } else if (width > MAX_LANDSCAPE_IMAGE_WIDTH) {
    throw new Error(
      `Image file ${key}: Image width exceeds the maximum limit for landscape orientation: ${MAX_LANDSCAPE_IMAGE_WIDTH}`,
    );
  } else if (height < MIN_LANDSCAPE_IMAGE_HEIGHT) {
    throw new Error(
      `Image file ${key}: Image height is less than the minimum limit for landscape orientation: ${MIN_LANDSCAPE_IMAGE_HEIGHT}`,
    );
  } else if (height > MAX_LANDSCAPE_IMAGE_HEIGHT) {
    throw new Error(
      `Image file ${key}: Image height exceeds the maximum limit for landscape orientation: ${MAX_LANDSCAPE_IMAGE_HEIGHT}`,
    );
  }
}

function assertSquareImageDimensions(key: string, width: number, height: number) {
  if (width < MIN_SQUARE_IMAGE_WIDTH) {
    throw new Error(
      `Image file ${key}: Image width is less than the minimum limit for square orientation: ${MIN_SQUARE_IMAGE_WIDTH}`,
    );
  } else if (width > MAX_SQUARE_IMAGE_WIDTH) {
    throw new Error(
      `Image file ${key}: Image width exceeds the maximum limit for square orientation: ${MAX_SQUARE_IMAGE_WIDTH}`,
    );
  } else if (height < MIN_SQUARE_IMAGE_HEIGHT) {
    throw new Error(
      `Image file ${key}: Image height is less than the minimum limit for square orientation: ${MIN_SQUARE_IMAGE_HEIGHT}`,
    );
  } else if (height > MAX_SQUARE_IMAGE_HEIGHT) {
    throw new Error(
      `Image file ${key}: Image height exceeds the maximum limit for square orientation: ${MAX_SQUARE_IMAGE_HEIGHT}`,
    );
  }
}
