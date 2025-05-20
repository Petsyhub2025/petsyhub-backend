export function getCloudFrontUrlForS3Key(s3Key: string): string {
  return `${process.env.MEDIA_DOMAIN}/${s3Key}`;
}
