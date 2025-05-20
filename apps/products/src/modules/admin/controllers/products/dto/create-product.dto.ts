import { ApiProperty, PickType } from '@nestjs/swagger';
import { MediaUploadFilePreSignedUrl, Product, TransformObjectId, TransformObjectIds } from '@instapets-backend/common';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateProductDto extends PickType(Product, ['name', 'description'] as const) {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => MediaUploadFilePreSignedUrl)
  @ApiProperty({ type: [MediaUploadFilePreSignedUrl] })
  media: MediaUploadFilePreSignedUrl[];

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  category: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  subCategory: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  supplier: Types.ObjectId;

  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  petTypes: Types.ObjectId[];
}
