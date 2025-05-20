import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Media } from '@common/schemas/mongoose/common/media';
import { IsBoolean, IsObject, IsOptional, IsString, IsUUID, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { DynamicLinkLinkToSubSchemaType } from './dynamic-link-subschemas/link-to';

export class DynamicLink extends BaseModel<DynamicLink> {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  linkedTo?: DynamicLinkLinkToSubSchemaType;

  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(100)
  previewTitle: string;

  @IsString()
  @MaxLength(1000)
  previewDescription: string;

  @IsObject()
  @ValidateNested()
  previewMedia: Media;

  @IsOptional()
  @IsUUID()
  previewMediaProcessingId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  linkedMedia?: Media;

  @IsBoolean()
  useLinkedMedia: boolean;

  @IsString()
  @IsUrl()
  deepLink: string;

  @IsBoolean()
  isArchived?: boolean;
}

export interface IDynamicLinkInstanceMethods extends IBaseInstanceMethods {}
export interface IDynamicLinkModel extends Model<DynamicLink, Record<string, unknown>, IDynamicLinkInstanceMethods> {}
