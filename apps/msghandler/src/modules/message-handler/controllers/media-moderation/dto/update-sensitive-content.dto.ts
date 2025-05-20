import { IsObject, IsString, ValidateNested } from 'class-validator';
import { ResourceModelDto } from '@serverless/common/classes/validations/resource-model.class';

export class UpdateSensitiveContentDto {
  @IsString()
  s3Key: string;

  @IsObject()
  @ValidateNested()
  resourceModel: ResourceModelDto;
}
