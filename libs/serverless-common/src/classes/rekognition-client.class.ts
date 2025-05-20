import {
  RekognitionClient as AwsRekognitionClient,
  DetectModerationLabelsCommand,
  GetContentModerationCommand,
  StartContentModerationCommand,
} from '@aws-sdk/client-rekognition';
import { Logger } from './logger.class';

export class RekognitionClient {
  private static instance: RekognitionClient;
  private rekognition: AwsRekognitionClient;
  private logger = Logger.getInstance();

  private constructor() {
    this.rekognition = new AwsRekognitionClient({
      credentials: {
        accessKeyId: process.env.AWS_REKOGNITION_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_REKOGNITION_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REKOGNITION_REGION,
    });
  }

  public static getInstance(): RekognitionClient {
    if (!RekognitionClient.instance) {
      RekognitionClient.instance = new RekognitionClient();
    }

    return RekognitionClient.instance;
  }

  public async detectImageModerationLabelsFromS3(s3Key: string) {
    try {
      const command = new DetectModerationLabelsCommand({
        Image: {
          S3Object: {
            Bucket: process.env.AWS_TEMP_UPLOAD_BUCKET_NAME,
            Name: s3Key,
          },
        },
        MinConfidence: 10,
      });

      return this.rekognition.send(command);
    } catch (error) {
      this.logger.error('RekognitionClient.detectImageModerationLabelsFromS3', { error });
      throw error;
    }
  }

  public async detectImageModerationLabelsFromBuffer(file: Uint8Array | Buffer) {
    try {
      const command = new DetectModerationLabelsCommand({
        Image: {
          Bytes: file,
        },
        MinConfidence: 10,
      });

      return this.rekognition.send(command);
    } catch (error) {
      this.logger.error('RekognitionClient.detectImageModerationLabelsFromBuffer', { error });
      throw error;
    }
  }

  public async startVideoContentModerationAnalysisJob(s3Key: string) {
    try {
      const command = new StartContentModerationCommand({
        Video: {
          S3Object: {
            Bucket: process.env.AWS_TEMP_UPLOAD_BUCKET_NAME,
            Name: s3Key,
          },
        },
        MinConfidence: 10,
        NotificationChannel: {
          RoleArn: process.env.AWS_REKOGNITION_JOB_ROLE_ARN,
          SNSTopicArn: process.env.AWS_SNS_VIDEO_ANALYSIS_TOPIC_ARN,
        },
      });

      return this.rekognition.send(command);
    } catch (error) {
      this.logger.error('RekognitionClient.detectImageModerationLabels', { error });
      throw error;
    }
  }

  public async getContentModerationJobResults(jobId: string) {
    try {
      const command = new GetContentModerationCommand({
        JobId: jobId,
      });

      return this.rekognition.send(command);
    } catch (error) {
      this.logger.error('RekognitionClient.getContentModerationJobResults', { error });
      throw error;
    }
  }
}
