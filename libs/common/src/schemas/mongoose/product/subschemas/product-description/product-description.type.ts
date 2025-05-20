import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';

export class ProductDescriptionSubSchemaType {
  @IsObject()
  @ValidateNested()
  text: LocalizedText;

  @IsOptional()
  @IsArray({ each: true })
  @ValidateNested({ each: true })
  bulletPoints?: LocalizedText[];
}
