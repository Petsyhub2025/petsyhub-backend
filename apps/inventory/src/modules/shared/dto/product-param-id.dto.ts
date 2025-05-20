import { IsMongoId } from 'class-validator';

export class ProductIdParamDto {
  @IsMongoId()
  productId: string;
}
