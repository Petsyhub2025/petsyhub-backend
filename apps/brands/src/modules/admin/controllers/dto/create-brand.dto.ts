import { Brand, MediaUploadFilePreSignedUrl } from '@instapets-backend/common';
import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

export class CreateBrandDto extends PickType(Brand, ['name'] as const) {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MediaUploadFilePreSignedUrl)
  logoPictureMedia?: MediaUploadFilePreSignedUrl;
}
