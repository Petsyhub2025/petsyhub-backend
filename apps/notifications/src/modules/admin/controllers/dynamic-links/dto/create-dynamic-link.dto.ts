import { DynamicLink, Media, MediaUploadFile } from '@instapets-backend/common';
import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';
import {
  IsLinkedToExistsWhenUsingLinkedMedia,
  IsMediaManuallyProvidedWhenNotUsingLinkedMedia,
} from '@notifications/admin/controllers/dynamic-links/custom-validations';

export class CreateDynamicLinkDto extends PickType(DynamicLink, [
  'linkedTo',
  'title',
  'previewTitle',
  'previewDescription',
  'useLinkedMedia',
] as const) {
  @Validate(IsMediaManuallyProvidedWhenNotUsingLinkedMedia)
  @Validate(IsLinkedToExistsWhenUsingLinkedMedia)
  useLinkedMedia: boolean;

  @IsOptional()
  @ApiPropertyOptional({
    type: MediaUploadFile,
    description: 'previewMediaUpload is required when useLinkedMedia is false',
  })
  previewMediaUpload: MediaUploadFile;
}
