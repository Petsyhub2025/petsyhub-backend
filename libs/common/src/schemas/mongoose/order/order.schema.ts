import { Connection, HydratedDocument, Schema } from 'mongoose';
import { IOrderInstanceMethods, IOrderModel, Order } from './order.type';
import { ModelNames } from '@common/constants';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { OrderedProductsSubSchema } from './subschemas/ordered-products';
import { OrderPaymentMethodTypeEnum, OrderStatusEnum, PaymentStatusEnum } from './order.enum';
import { CountryCurrenciesEnum } from '@common/schemas/mongoose/country/country.enum';
import { generateUniqueIdFromPrefix } from '@common/helpers/unique-id-generator.helper';
import { UniquePrefixEnum } from '@common/enums';
import { ShippingTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

const OrderSchema = new Schema<Order, IOrderModel, IOrderInstanceMethods>(
  {
    customer: { type: Schema.Types.ObjectId, ref: ModelNames.CUSTOMER, required: true },
    generatedUniqueId: { type: String, required: true },
    orderedProducts: { type: [OrderedProductsSubSchema], required: true },
    productsCategories: { type: [Schema.Types.ObjectId], ref: ModelNames.PRODUCT_CATEGORY, required: true },
    productsSubCategories: { type: [Schema.Types.ObjectId], ref: ModelNames.PRODUCT_SUBCATEGORY, required: true },
    productsSuppliers: { type: [Schema.Types.ObjectId], ref: ModelNames.BRAND, required: true },
    productsProvidedShop: { type: Schema.Types.ObjectId, ref: ModelNames.BASE_BRANCH, required: true },
    status: { type: String, enum: OrderStatusEnum },
    paymentStatus: { type: String, enum: PaymentStatusEnum },
    paymentMethodType: { type: String, enum: OrderPaymentMethodTypeEnum },
    deliveredToAddress: { type: Schema.Types.ObjectId, ref: ModelNames.CUSTOMER_ADDRESS, required: true },
    currency: { type: String, enum: CountryCurrenciesEnum },
    amountSubTotal: { type: Number, required: true },
    amountTotal: { type: Number, required: true },
    shippingFee: { type: Number, required: false, default: 0 },
    tax: { type: Number, required: false },
    stripePaymentIntentId: { type: String, required: false },
    stripePaymentMethodId: { type: String, required: false },
    rating: { type: Number, required: false },
    customerFeedback: { type: String, required: false },
    isShippedByShop: { type: Boolean, required: false },
    shippingType: { type: String, required: true, enum: ShippingTypeEnum },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function orderSchemaFactory(connection: Connection) {
  OrderSchema.index({ customer: 1 });
  OrderSchema.index({ status: 1 });
  OrderSchema.index({ productsProvidedShop: 1 });

  OrderSchema.pre('validate', async function () {
    if (!this.generatedUniqueId) {
      this.generatedUniqueId = generateUniqueIdFromPrefix(UniquePrefixEnum.ORDER);
    }
  });

  OrderSchema.pre('validate', async function () {
    await validateSchema(this, Order);
  });

  OrderSchema.methods.deleteDoc = async function (this: HydratedDocument<Order>) {
    await this.deleteOne();
  };

  const orderModel = connection.model(ModelNames.ORDER, OrderSchema);

  return orderModel;
}
