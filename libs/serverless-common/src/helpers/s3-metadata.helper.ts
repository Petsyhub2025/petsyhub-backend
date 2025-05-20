import { Media } from '@common/schemas/mongoose/common/media/media.type';

export function getS3MetadataFromMedia(media: Media): Record<string, string> {
  const metadata = {};

  Object.entries(media).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      if (value instanceof Date) {
        metadata[key] = value.toISOString();
      } else {
        // Convert other objects to a JSON string
        metadata[key] = JSON.stringify(value);
      }
    } else {
      // Convert non-object values to string
      metadata[key] = String(value);
    }
  });

  return metadata;
}

export function parseS3Metadata<T>(metadata: Record<string, string>): T {
  const media = {} as T;

  Object.entries(metadata).forEach(([key, value]) => {
    try {
      media[key] = JSON.parse(value);
    } catch (error) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        media[key] = date;
        return;
      }

      const number = Number(value);
      if (!isNaN(number)) {
        media[key] = number;
        return;
      }

      media[key] = value;
    }
  });

  return media;
}
