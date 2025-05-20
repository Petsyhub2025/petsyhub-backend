import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ResourceModelDto {
  @IsString()
  @IsEnum(UploadModelResources)
  name: UploadModelResources;

  @IsOptional()
  @IsUUID()
  mediaProcessingId?: string;
}
