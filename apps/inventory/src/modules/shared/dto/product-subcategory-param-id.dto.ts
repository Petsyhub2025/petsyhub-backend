import { IsMongoId } from 'class-validator';

export class ProductSubCategoryIdParamDto {
  @IsMongoId()
  productSubCategoryId: string;
}
