import { MediaUploadFile } from '@common/schemas/mongoose/common/media/media-upload-file.type';
import { MediaTypeEnum } from '@common/schemas/mongoose/common/media/media.enum';
import { ResourceModelDto } from '@serverless/common/classes/validations/resource-model.class';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class MediaModerationLambdaEvent {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => MediaUploadFile)
  files: MediaUploadFile[];

  @IsOptional()
  @IsBoolean()
  isUploadedByAdmin?: boolean = false;

  @IsString()
  @Matches(/^([a-zA-Z0-9-]+\/)*[a-zA-Z0-9-]+$/)
  filesS3PathPrefix: string;

  @IsObject()
  @ValidateNested()
  resourceModel: ResourceModelDto;

  @IsArray()
  @IsString({ each: true })
  @IsEnum(MediaTypeEnum, { each: true })
  allowedMediaTypes: MediaTypeEnum[] = [MediaTypeEnum.IMAGE];
}
