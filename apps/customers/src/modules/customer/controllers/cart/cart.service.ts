import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';
import { AddToCartDto, CartActionEnum } from './dto/add-to-cart.dto';
import { ModelNames } from '@common/constants';
import {
  Cart,
  CustomError,
  ErrorType,
  ICartModel,
  IInventoryModel,
  IProductModel,
  IShippingConfigModel,
  IShopBranchModel,
  ShippingTypeEnum,
} from '@instapets-backend/common';
import { ProductIdParamDto } from '@customers/customer/shared/dto/product-id-param.dto';
import { AddListToCartDto, CartItemDto } from './dto/add-lits-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(ModelNames.PRODUCT) private readonly productModel: IProductModel,
    @Inject(ModelNames.CART) private readonly cartModel: ICartModel,
    @Inject(ModelNames.INVENTORY) private readonly inventoryModel: IInventoryModel,
    @Inject(ModelNames.BASE_BRANCH) private shopBranchModel: IShopBranchModel,
    @Inject(ModelNames.SHIPPING_CONFIG) private readonly shippingConfigModel: IShippingConfigModel,
  ) {}

  async addToCart(customerId: string | Types.ObjectId, body: AddToCartDto) {
    const { productId, quantity, shopId, action } = body;

    const product = await this.productModel.exists({ _id: new Types.ObjectId(productId) });
    if (!product)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'لا يوحد هذا المنتج',
            en: 'Product not found',
          },
          event: 'PRODUCT_NOT_FOUND',
        }),
      );

    const productInventoryExists = await this.inventoryModel.findOne({
      'product.productId': new Types.ObjectId(productId),
      branch: new Types.ObjectId(shopId),
    });
    if (!productInventoryExists)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'لا يوحد هذا المنتج',
            en: 'Product not found',
          },
          event: 'PRODUCT_NOT_FOUND',
        }),
      );

    if (productInventoryExists.product.quantityInStock < quantity) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid quantity to be processed',
            ar: 'الكمية غير صالحة للمعالجة',
          },
          event: 'INVALID_QUANTITY',
          errorType: ErrorType.CONFLICT,
        }),
      );
    }

    switch (action) {
      case CartActionEnum.ADD:
        const productAlreadyAddedToCustomerCart = await this.cartModel.exists({
          customer: new Types.ObjectId(customerId),
          product: new Types.ObjectId(productId),
        });
        if (productAlreadyAddedToCustomerCart) {
          throw new ConflictException(
            new CustomError({
              localizedMessage: {
                en: 'The product is already added to the cart',
                ar: 'تم إضافة المنتج بالفعل إلى سلة التسوق',
              },
              event: 'PRODUCT_ALREADY_ADDED',
              errorType: ErrorType.CONFLICT,
            }),
          );
        }

        const customerCart = await this.cartModel.find({ customer: new Types.ObjectId(customerId) });
        if (
          customerCart.length > 0 &&
          (await this.cartModel.exists({
            customer: new Types.ObjectId(customerId),
            shop: { $ne: new Types.ObjectId(shopId) },
          }))
        ) {
          throw new ConflictException(
            new CustomError({
              localizedMessage: {
                en: 'You cannot order from multiple shops in the same order',
                ar: 'لا يمكنك الطلب من أكثر من متجر في نفس الطلب',
              },
              event: 'PRODUCT_ALREADY_ADDED',
              errorType: ErrorType.CONFLICT,
            }),
          );
        }

        const productAddedToCart = new this.cartModel({
          customer: new Types.ObjectId(customerId),
          product: new Types.ObjectId(productId),
          shop: new Types.ObjectId(shopId),
          quantity,
        });
        await productAddedToCart.save();

        break;

      case CartActionEnum.INCREMENT:
        await this.incrementProductCartQuantity(customerId, body);
        break;
      case CartActionEnum.DECREMENT:
        await this.decrementProductCartQuantity(customerId, body);
        break;

      default:
        break;
    }
  }

  async addListOfProductsToCart(customerId: string | Types.ObjectId, { cartItems }: AddListToCartDto) {
    cartItems.forEach(async ({ productId, quantity, shopId }: CartItemDto) => {
      const product = await this.productModel.exists({ _id: new Types.ObjectId(productId) });
      if (!product)
        throw new NotFoundException(
          new CustomError({
            localizedMessage: {
              ar: 'لا يوحد هذا المنتج',
              en: 'Product not found',
            },
            event: 'PRODUCT_NOT_FOUND',
          }),
        );

      const productInventoryExists = await this.inventoryModel.findOne({
        'product.productId': new Types.ObjectId(productId),
        branch: new Types.ObjectId(shopId),
      });
      if (!productInventoryExists)
        throw new NotFoundException(
          new CustomError({
            localizedMessage: {
              ar: 'لا يوحد هذا المنتج في هذا الفرع',
              en: 'Product not found in this shop',
            },
            event: 'PRODUCT_NOT_FOUND',
          }),
        );

      if (productInventoryExists.product.quantityInStock < quantity) {
        throw new ConflictException(
          new CustomError({
            localizedMessage: {
              en: 'Invalid quantity to be processed',
              ar: 'الكمية غير صالحة للمعالجة',
            },
            event: 'INVALID_QUANTITY',
            errorType: ErrorType.CONFLICT,
          }),
        );
      }

      const productAlreadyAddedToCustomerCart = await this.cartModel.exists({
        customer: new Types.ObjectId(customerId),
        product: new Types.ObjectId(productId),
      });
      if (productAlreadyAddedToCustomerCart) {
        throw new ConflictException(
          new CustomError({
            localizedMessage: {
              en: 'The product is already added to the cart',
              ar: 'تم إضافة المنتج بالفعل إلى سلة التسوق',
            },
            event: 'PRODUCT_ALREADY_ADDED',
            errorType: ErrorType.CONFLICT,
          }),
        );
      }

      const customerCart = await this.cartModel.find({ customer: new Types.ObjectId(customerId) });
      if (
        customerCart.length > 0 &&
        (await this.cartModel.exists({
          customer: new Types.ObjectId(customerId),
          shop: { $ne: new Types.ObjectId(shopId) },
        }))
      ) {
        throw new ConflictException(
          new CustomError({
            localizedMessage: {
              en: 'You cannot order from multiple shops in the same order',
              ar: 'لا يمكنك الطلب من أكثر من متجر في نفس الطلب',
            },
            event: 'PRODUCT_ALREADY_ADDED',
            errorType: ErrorType.CONFLICT,
          }),
        );
      }

      const productAddedToCart = new this.cartModel({
        customer: new Types.ObjectId(customerId),
        product: new Types.ObjectId(productId),
        shop: new Types.ObjectId(shopId),
        quantity,
      });
      await productAddedToCart.save();
    });
  }
  async deleteCartProduct(customerId: string | Types.ObjectId, { productId }: ProductIdParamDto) {
    const product = await this.productModel.exists({ _id: new Types.ObjectId(productId) });
    if (!product)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'لا يوحد هذا المنتج',
            en: 'Product not found',
          },
          event: 'PRODUCT_NOT_FOUND',
        }),
      );

    const cartItem = await this.cartModel.findOne({
      customer: new Types.ObjectId(customerId),
      product: new Types.ObjectId(productId),
    });

    if (!cartItem) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Product did not added to your cart',
            ar: 'لم يتم اضافة هذا المنتج من قبل في عربة التسوق',
          },
          event: 'PRODUCT_NOT_ADDED_TO_CART',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }
    await cartItem.deleteDoc();
  }

  async getCartList(customerId: string | Types.ObjectId) {
    const cart = await this.cartModel.aggregate([
      {
        $match: {
          customer: new Types.ObjectId(customerId),
        },
      },
      {
        $lookup: {
          from: 'inventories',
          let: {
            productId: '$product',
            shopId: '$shop',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        '$product.productId',
                        {
                          $ifNull: ['$$productId', null],
                        },
                      ],
                    },
                    {
                      $eq: [
                        '$branch',
                        {
                          $ifNull: ['$$shopId', null],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $addFields: {
                inStock: {
                  $cond: {
                    if: {
                      $gte: ['$product.quantityInStock', 1],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                product: {
                  _id: '$product.productId',
                  name: '$product.name',
                  media: '$product.media',
                  price: '$product.price',
                  quantityInStock: '$product.quantityInStock',
                  currency: '$product.currency',
                  inStock: '$inStock',
                },
              },
            },
          ],
          as: 'inventory',
        },
      },
      {
        $unwind: {
          path: '$inventory',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          product: '$inventory.product',
          quantity: 1,
          shop: 1,
          _id: 0,
        },
      },
    ]);
    if (!cart?.length) {
      return { cart: [] };
    }

    const shop = await this.shopBranchModel.findOne({ _id: new Types.ObjectId(cart[0].shop) });
    const shippingConfig = await this.shippingConfigModel.findOne();
    if (shop.isSelfShipping) {
      let amountSubTotal: number = 0;
      let currency: string;

      cart.forEach((cartItem) => {
        amountSubTotal += cartItem.product.price * cartItem.quantity;
        currency = cartItem.product.currency;
      });

      const taxValue = (amountSubTotal * shippingConfig.tax) / 100;

      return {
        cart,
        ...(shop.shippingType === ShippingTypeEnum.PAID
          ? { amountTotal: amountSubTotal + shop.shippingFee + taxValue }
          : { amountTotal: amountSubTotal + taxValue }),
        amountSubTotal,
        currency,
        shippingFee: shop.shippingFee,
        shippingType: shop.shippingType,
        tax: taxValue,
      };
    }

    let amountSubTotal: number = 0;
    let currency: string;

    cart.forEach((cartItem) => {
      amountSubTotal += cartItem.product.price * cartItem.quantity;
      currency = cartItem.product.currency;
    });

    const taxValue = (amountSubTotal * shippingConfig.tax) / 100;

    return {
      cart,
      amountTotal: amountSubTotal + shippingConfig.shippingFee + taxValue,
      amountSubTotal,
      currency,
      shippingFee: shippingConfig.shippingFee,
      shippingType: 'paid',
      tax: taxValue,
    };
  }

  async clearCustomerCartProducts(customerId: string | Types.ObjectId) {
    const cartItem = await this.cartModel.findOne({
      customer: new Types.ObjectId(customerId),
    });
    if (!cartItem)
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            en: 'Customer cart is',
            ar: 'عربة التسوق فارغة ',
          },
          event: 'CART_EMPTY',
          errorType: ErrorType.CONFLICT,
        }),
      );

    await this.cartModel.deleteMany({ customer: new Types.ObjectId(customerId) });
  }

  private async incrementProductCartQuantity(
    customerId: string | Types.ObjectId,
    { shopId, productId, quantity }: AddToCartDto,
  ) {
    const cartItem = await this.cartModel.findOne({
      customer: new Types.ObjectId(customerId),
      product: new Types.ObjectId(productId),
      shop: new Types.ObjectId(shopId),
    });
    if (!cartItem)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Product did not added to your cart',
            ar: 'لم يتم اضافة هذا المنتج من قبل في عربة التسوق',
          },
          event: 'PRODUCT_NOT_ADDED_TO_CART',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    const productInventoryExists = await this.inventoryModel.findOne({
      'product.productId': cartItem.product,
      branch: cartItem.shop,
    });

    const incrementedQuantity = cartItem.quantity + quantity;
    if (productInventoryExists.product.quantityInStock < incrementedQuantity) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid quantity to be processed',
            ar: 'الكمية غير صالحة للمعالجة',
          },
          event: 'INVALID_QUANTITY',
          errorType: ErrorType.CONFLICT,
        }),
      );
    }
    cartItem.quantity += quantity;
    await cartItem.save();
  }
  private async decrementProductCartQuantity(
    customerId: string | Types.ObjectId,
    { shopId, productId, quantity }: AddToCartDto,
  ) {
    const cartItem = await this.cartModel.findOne({
      customer: new Types.ObjectId(customerId),
      product: new Types.ObjectId(productId),
      shop: new Types.ObjectId(shopId),
    });
    if (!cartItem)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Product did not added to your cart',
            ar: 'لم يتم اضافة هذا المنتج من قبل في عربة التسوق',
          },
          event: 'PRODUCT_NOT_ADDED_TO_CART',
          errorType: ErrorType.NOT_FOUND,
        }),
      );

    cartItem.quantity -= quantity;
    await cartItem.save();
  }
}
