import { IsMongoId } from 'class-validator';

export class ShopIdParamDto {
  @IsMongoId()
  shopId: string;
}
