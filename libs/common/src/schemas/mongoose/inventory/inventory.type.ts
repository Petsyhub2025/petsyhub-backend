import { TransformObjectId } from '@common/decorators/class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Model, Types } from 'mongoose';
import { ProductExtendedType } from './subschemas/product-extended';
import { Type } from 'class-transformer';

export class Inventory extends BaseModel<Inventory> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  branch: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  brand: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  @Type(() => ProductExtendedType)
  product: ProductExtendedType;
}
export interface IInventoryInstanceMethods extends IBaseInstanceMethods {
  decrementStock(quantity: number): void;
}
export interface IInventoryModel extends Model<Inventory, Record<string, unknown>, IInventoryInstanceMethods> {}
