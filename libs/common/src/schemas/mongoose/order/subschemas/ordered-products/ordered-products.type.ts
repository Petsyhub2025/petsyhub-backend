import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

export class OrderedProductsSubSchemaType {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  productId: Types.ObjectId;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(1)
  orderedPrice: number;
}
