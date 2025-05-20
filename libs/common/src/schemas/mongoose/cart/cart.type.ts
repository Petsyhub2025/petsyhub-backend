import { TransformObjectId } from '@common/decorators/class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { IsInstance, IsNumber } from 'class-validator';
import { Model, Types } from 'mongoose';

export class Cart extends BaseModel<Cart> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  customer: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  product: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  shop: Types.ObjectId;

  @IsNumber()
  quantity: number;
}
export interface ICartInstanceMethods extends IBaseInstanceMethods {}
export interface ICartModel extends Model<Cart, Record<string, unknown>, ICartInstanceMethods> {}
