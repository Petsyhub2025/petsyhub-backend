import { CopyObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CustomError } from '@common/classes/custom-error.class';
import { ErrorType } from '@common/enums';
import { AWS_S3_CLIENT, AWS_S3_MODULE_OPTIONS } from '@common/modules/aws-s3/constants';
import { AwsS3ModuleOptions } from '@common/modules/aws-s3/interfaces';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AwsS3Service {
  private logger = new Logger(AwsS3Service.name);
  constructor(
    @Inject(AWS_S3_CLIENT) private s3Client: S3Client,
    @Inject(AWS_S3_MODULE_OPTIONS) private options: AwsS3ModuleOptions,
    private appConfig: AppConfig,
  ) {}

  getS3Config() {
    return {
      region: this.options.region,
      bucket: this.appConfig.AWS_TEMP_UPLOAD_BUCKET_NAME,
    };
  }

  async generatePresignedUrl(key: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.appConfig.AWS_UPLOAD_BUCKET_NAME, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn: 30 * 60 }); // 30 minutes
  }

  async uploadObjectToTempMediaBucket(key: string, body: Uint8Array | Buffer) {
    const command = new PutObjectCommand({
      Bucket: this.appConfig.AWS_TEMP_UPLOAD_BUCKET_NAME,
      Key: key,
      Body: body,
    });

    try {
      return this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Error putting object to S3: ${error?.message}`, {
        key,
        bucket: this.appConfig.AWS_TEMP_UPLOAD_BUCKET_NAME,
        error,
      });

      return null;
    }
  }

  async copyObjectToMediaBucket(s3Key: string, key: string) {
    const command = new CopyObjectCommand({
      Bucket: this.appConfig.AWS_UPLOAD_BUCKET_NAME,
      CopySource: `${this.appConfig.AWS_TEMP_UPLOAD_BUCKET_NAME}/${s3Key}`,
      Key: key,
    });

    try {
      return this.s3Client.send(command);
    } catch (error) {
      throw new CustomError({
        localizedMessage: {
          ar: '',
          en: 'Something went wrong while uploading media, try again',
        },
        event: 'MEDIA_UPLOAD_ERROR',
        error: ErrorType.BACKEND_CODE,
      });
    }
  }

  async getObjectFromMediaBucket(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.appConfig.AWS_UPLOAD_BUCKET_NAME,
      Key: key,
    });

    try {
      return this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Error getting object from S3: ${error?.message}`, {
        key,
        bucket: this.appConfig.AWS_UPLOAD_BUCKET_NAME,
        error,
      });

      return null;
    }
  }
}
