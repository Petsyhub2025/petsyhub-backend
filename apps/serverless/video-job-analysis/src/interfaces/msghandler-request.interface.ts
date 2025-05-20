import { ResourceModelDto } from '@serverless/common/classes/validations/resource-model.class';

export interface IMsgHandlerRequest {
  s3Key: string;
  resourceModel: ResourceModelDto;
}
