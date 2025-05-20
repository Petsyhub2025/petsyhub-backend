import { Connection, HydratedDocument, Schema } from 'mongoose';
import { IInventoryInstanceMethods, IInventoryModel, Inventory } from './inventory.type';
import { ModelNames } from '@common/constants';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ProductExtendedSchema } from './subschemas/product-extended';

const InventorySchema = new Schema<Inventory, IInventoryModel, IInventoryInstanceMethods>(
  {
    branch: { type: Schema.Types.ObjectId, ref: ModelNames.BASE_BRANCH, required: true },
    brand: { type: Schema.Types.ObjectId, ref: ModelNames.BRAND, required: true },
    product: { type: ProductExtendedSchema, required: true },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function inventorySchemaFactory(connection: Connection) {
  InventorySchema.index({ branch: 1 });
  InventorySchema.index({ brand: 1 });
  InventorySchema.index({ 'product.productId': 1 });
  InventorySchema.index({ 'product.category': 1 });
  InventorySchema.index({ 'product.subCategory': 1 });
  InventorySchema.index({ 'product.brand': 1 });
  InventorySchema.index({ 'product.petTypes': 1 });
  InventorySchema.index({ 'product.price': 1 });

  InventorySchema.pre('validate', async function () {
    await validateSchema(this, Inventory);
  });

  InventorySchema.methods.decrementStock = async function (quantity: number) {
    if (quantity > this.product.quantityInStock) {
      return;
    }
    this.product.quantityInStock -= quantity;
    await this.save();
  };

  InventorySchema.methods.deleteDoc = async function (this: HydratedDocument<Inventory>) {
    //await this.deleteOne();
  };

  const inventoryModel = connection.model(ModelNames.INVENTORY, InventorySchema);

  return inventoryModel;
}
