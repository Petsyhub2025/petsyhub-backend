import { ApiProperty, PickType } from '@nestjs/swagger';
import { MediaUploadFilePreSignedUrl, ProductSubCategory, TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateProductSubCategoryDto extends PickType(ProductSubCategory, ['name'] as const) {
  @IsObject()
  @ValidateNested()
  @Type(() => MediaUploadFilePreSignedUrl)
  @ApiProperty({ type: MediaUploadFilePreSignedUrl })
  iconMedia: MediaUploadFilePreSignedUrl;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  productCategory: Types.ObjectId;
}
