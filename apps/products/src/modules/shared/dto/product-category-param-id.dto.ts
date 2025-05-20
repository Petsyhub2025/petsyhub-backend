import { IsMongoId } from 'class-validator';

export class ProductCategoryIdParamDto {
  @IsMongoId()
  productCategoryId: string;
}
