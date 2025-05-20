import { ApiProperty, PickType } from '@nestjs/swagger';
import { MediaUploadFilePreSignedUrl, ProductCategory } from '@instapets-backend/common';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductCategoryDto extends PickType(ProductCategory, ['name', 'description'] as const) {
  @IsObject()
  @ValidateNested()
  @Type(() => MediaUploadFilePreSignedUrl)
  @ApiProperty({ type: MediaUploadFilePreSignedUrl })
  iconMedia: MediaUploadFilePreSignedUrl;
}
