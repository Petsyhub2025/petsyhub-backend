import { ResourceModelDto } from '@serverless/common/classes/validations/resource-model.class';

export interface VideoJob {
  jobId: string;
  s3Key: string;
  uploadStatus: 'success' | 'failed';
  resourceModel: ResourceModelDto;
  expiresAt: number;
}
