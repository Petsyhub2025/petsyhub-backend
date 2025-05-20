export function getVideoThumbnailS3KeyFromVideoKey(videoKey: string) {
  return videoKey.replace(/\.[^/.]+$/, '.webp');
}
