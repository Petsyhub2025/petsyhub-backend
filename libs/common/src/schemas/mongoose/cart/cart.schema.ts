import { Connection, HydratedDocument, Schema } from 'mongoose';
import { ICartInstanceMethods, ICartModel, Cart } from './cart.type';
import { ModelNames } from '@common/constants';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const CartSchema = new Schema<Cart, ICartModel, ICartInstanceMethods>(
  {
    customer: { type: Schema.Types.ObjectId, ref: ModelNames.CUSTOMER, required: true },
    product: { type: Schema.Types.ObjectId, ref: ModelNames.PRODUCT, required: true },
    shop: { type: Schema.Types.ObjectId, ref: ModelNames.BASE_BRANCH, required: true },
    quantity: { type: Number, required: true },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function cartSchemaFactory(connection: Connection) {
  CartSchema.index({ customer: 1 });
  CartSchema.index({ product: 1 });
  CartSchema.index({ shop: 1 });
  CartSchema.index({ customer: 1, product: 1, shop: 1 });

  CartSchema.pre('validate', async function () {
    await validateSchema(this, Cart);
  });

  CartSchema.methods.deleteDoc = async function (this: HydratedDocument<Cart>) {
    await this.deleteOne();
  };

  const cartModel = connection.model(ModelNames.CART, CartSchema);

  return cartModel;
}
