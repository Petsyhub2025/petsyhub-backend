import {
  S3Client as AwsS3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Logger } from './logger.class';
import { ProcessedFileFormats } from '@serverless/common/enums/processed-file-formats.enum';
import { Media } from '@common/schemas/mongoose/common/media/media.type';
import { getS3MetadataFromMedia } from '@serverless/common/helpers';

export class S3Client {
  private static instance: S3Client;
  private s3: AwsS3Client;
  private logger = Logger.getInstance();

  private constructor() {
    this.s3 = new AwsS3Client({
      credentials: {
        accessKeyId: process.env.AWS_UPLOAD_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_UPLOAD_SECRET_ACCESS_KEY!,
      },
      region: process.env.AWS_UPLOAD_REGION,
    });
  }

  public static getInstance(): S3Client {
    if (!S3Client.instance) {
      S3Client.instance = new S3Client();
    }

    return S3Client.instance;
  }

  async getObjectFromTempBucket(key: string) {
    const command = new GetObjectCommand({ Bucket: process.env.AWS_TEMP_UPLOAD_BUCKET_NAME, Key: key });

    try {
      const response = await this.s3.send(command);
      return response.Body?.transformToByteArray();
    } catch (error) {
      this.logger.error(`Error fetching object from S3: ${error?.message}`, {
        key,
        bucket: process.env.AWS_TEMP_UPLOAD_BUCKET_NAME,
        error,
      });
      return null;
    }
  }

  async getObjectFromMainBucket(key: string) {
    const command = new GetObjectCommand({ Bucket: process.env.AWS_UPLOAD_BUCKET_NAME, Key: key });

    try {
      const response = await this.s3.send(command);
      return response.Body?.transformToByteArray();
    } catch (error) {
      this.logger.error(`Error fetching object from S3: ${error?.message}`, {
        key,
        bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
        error,
      });
      return null;
    }
  }

  async getObjectMetadata(key: string) {
    const command = new HeadObjectCommand({ Bucket: process.env.AWS_UPLOAD_BUCKET_NAME, Key: key });

    try {
      return this.s3.send(command);
    } catch (error) {
      this.logger.error(`Error fetching object metadata from S3: ${error?.message}`, {
        key,
        bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
        error,
      });
      return null;
    }
  }

  async updateObjectMetadata(key: string, metadata: Media) {
    const command = new CopyObjectCommand({
      Bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
      Key: key,
      CopySource: `${process.env.AWS_UPLOAD_BUCKET_NAME}/${key}`,
      Metadata: getS3MetadataFromMedia(metadata),
      MetadataDirective: 'REPLACE',
    });

    try {
      return this.s3.send(command);
    } catch (error) {
      this.logger.error(`Error updating object metadata in S3: ${error?.message}`, {
        key,
        bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
        error,
      });
      return null;
    }
  }

  async putObject(key: string, body: Uint8Array | Buffer, contentType: ProcessedFileFormats, metadata?: Media) {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(metadata && { Metadata: getS3MetadataFromMedia(metadata) }),
    });

    try {
      return this.s3.send(command);
    } catch (error) {
      this.logger.error(`Error putting object to S3: ${error?.message}`, {
        key,
        bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
        error,
      });

      return null;
    }
  }

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({ Bucket: process.env.AWS_UPLOAD_BUCKET_NAME, Key: key });

    try {
      await this.s3.send(command);

      this.logger.log(`Deleted object from S3: ${key}`, { key, bucket: process.env.AWS_UPLOAD_BUCKET_NAME });
    } catch (error) {
      this.logger.error(`Error deleting object from S3: ${error?.message}`, {
        key,
        bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
        error,
      });

      return null;
    }
  }
}
