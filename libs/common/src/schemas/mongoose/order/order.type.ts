import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInstance,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Model, Types } from 'mongoose';
import { OrderPaymentMethodTypeEnum, OrderStatusEnum, PaymentStatusEnum } from './order.enum';
import { CountryCurrenciesEnum } from '@common/schemas/mongoose/country/country.enum';
import { OrderedProductsSubSchemaType } from './subschemas/ordered-products';
import { Type } from 'class-transformer';
import { ShippingTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export class Order extends BaseModel<Order> {
  @IsString()
  generatedUniqueId: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  customer: Types.ObjectId;

  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => OrderedProductsSubSchemaType)
  orderedProducts: OrderedProductsSubSchemaType[];

  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  productsCategories: Types.ObjectId[];

  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  productsSubCategories: Types.ObjectId[];

  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  productsSuppliers: Types.ObjectId[];

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  productsProvidedShop: Types.ObjectId;

  @IsString()
  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;

  @IsString()
  @IsEnum(PaymentStatusEnum)
  paymentStatus: PaymentStatusEnum;

  @IsString()
  @IsEnum(OrderPaymentMethodTypeEnum)
  paymentMethodType: OrderPaymentMethodTypeEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  deliveredToAddress: Types.ObjectId;

  @IsString()
  @IsEnum(CountryCurrenciesEnum)
  currency: CountryCurrenciesEnum;

  @IsNumber()
  @Min(0)
  amountSubTotal: number;

  @IsNumber()
  @Min(0)
  amountTotal: number;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsString()
  @IsEnum(ShippingTypeEnum)
  shippingType: ShippingTypeEnum;

  @IsBoolean()
  isShippedByShop: boolean;

  @IsNumber()
  tax: number;

  @IsString()
  @IsOptional()
  stripePaymentIntentId?: string;

  @IsString()
  @IsOptional()
  stripePaymentMethodId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  @IsOptional()
  customerFeedback?: string;
}
export interface IOrderInstanceMethods extends IBaseInstanceMethods {}
export interface IOrderModel extends Model<Order, Record<string, unknown>, IOrderInstanceMethods> {}
