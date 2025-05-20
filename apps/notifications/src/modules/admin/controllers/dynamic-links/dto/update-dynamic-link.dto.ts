import { DynamicLinkLinkToSubSchemaType, Media } from '@instapets-backend/common';
import { PartialType } from '@nestjs/swagger';
import {
  IsLinkedToExistsWhenUsingLinkedMedia,
  IsMediaManuallyProvidedWhenNotUsingLinkedMedia,
} from '@notifications/admin/controllers/dynamic-links/custom-validations';
import { Validate } from 'class-validator';
import { CreateDynamicLinkDto } from './create-dynamic-link.dto';

export class UpdateDynamicLinkDto extends PartialType(CreateDynamicLinkDto) {
  @Validate(IsLinkedToExistsWhenUsingLinkedMedia)
  linkedTo?: DynamicLinkLinkToSubSchemaType;

  @Validate(IsMediaManuallyProvidedWhenNotUsingLinkedMedia)
  previewMediaUpload?: Media;
}
