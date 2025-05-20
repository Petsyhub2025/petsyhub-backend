import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ModelNames } from '@common/constants';
import {
  IOrderModel,
  ICustomerAddressModel,
  ICartModel,
  OrderPaymentMethodTypeEnum,
  StripeService,
  ICustomerModel,
  CustomError,
  PaymentStatusEnum,
  OrderStatusEnum,
  IShopBranchModel,
  OrderedProductsSubSchemaType,
  BasePaginationQuery,
  addPaginationStages,
  IShippingConfigModel,
  ShippingTypeEnum,
  CustomerEventsEnum,
  Order,
  ServiceProviderEventsEnum,
  IBranchAccessControlModel,
  IServiceProviderModel,
  IInventoryModel,
} from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { PlaceOrderDto } from './dto/place-order.dto';
import { OrderIdParamDto } from '@orders/shared/dto/order-id-param.dto';
import Stripe from 'stripe';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ModelNames.CART) private readonly cartModel: ICartModel,
    @Inject(ModelNames.CUSTOMER_ADDRESS) private readonly customerAddressModel: ICustomerAddressModel,
    @Inject(ModelNames.ORDER) private readonly orderModel: IOrderModel,
    @Inject(ModelNames.CUSTOMER) private customerModel: ICustomerModel,
    @Inject(ModelNames.BASE_BRANCH) private shopBranchModel: IShopBranchModel,
    @Inject(ModelNames.BRANCH_ACCESS_CONTROL) private branchAccessControlModel: IBranchAccessControlModel,
    @Inject(ModelNames.SERVICE_PROVIDER) private readonly serviceProviderModel: IServiceProviderModel,
    @Inject(ModelNames.SHIPPING_CONFIG) private readonly shippingConfigModel: IShippingConfigModel,
    @Inject(ModelNames.INVENTORY) private readonly inventoryModel: IInventoryModel,
    private readonly stripeService: StripeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async checkout(customerId: string | Types.ObjectId) {
    const [cart, [shippingAddress]] = await Promise.all([
      this.cartModel.aggregate([
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
      ]),
      this.customerAddressModel.aggregate([
        { $match: { customer: new Types.ObjectId(customerId), isDefault: true } },
        {
          $lookup: {
            from: 'countries',
            let: {
              countryId: '$country',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      '$_id',
                      {
                        $ifNull: ['$$countryId', null],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'country',
          },
        },
        {
          $unwind: {
            path: '$country',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'cities',
            let: {
              cityId: '$city',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $ifNull: ['$$cityId', null] }],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'city',
          },
        },
        {
          $unwind: {
            path: '$city',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'areas',
            let: {
              areaId: '$area',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $ifNull: ['$$areaId', null] }],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'area',
          },
        },
        {
          $unwind: {
            path: '$area',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            city: 1,
            country: 1,
            area: 1,
            streetName: 1,
            location: 1,
            isDefault: 1,
            labelName: 1,
            addressType: 1,
            phoneNumber: 1,
            buildingName: 1,
            apartmentNumber: 1,
            floor: 1,
            additionalNotes: 1,
            landMark: 1,
            houseName: 1,
            companyName: 1,
          },
        },
      ]),
    ]);

    if (!cart?.length) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            ar: 'العربة فارغة، تابع التسوق',
            en: 'The cart is empty, continue shopping',
          },
          event: 'CARD_NOT_HANDLED',
        }),
      );
    }

    if (!shippingAddress) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            ar: 'لم يتم العثور على عنوان خاص بك',
            en: 'Your address was not found.',
          },
          event: 'ADDRESS_NOT_FOUND',
        }),
      );
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

      // const taxValue = (amountSubTotal * shippingConfig.tax) / 100;

      return {
        ...(shop.shippingType === ShippingTypeEnum.PAID
          ? { amountTotal: amountSubTotal + shop.shippingFee } //+ taxValue }
          : { amountTotal: amountSubTotal }), //+ taxValue }),
        amountSubTotal,
        currency,
        shippingFee: shop.shippingFee,
        shippingType: shop.shippingType,
        // tax: taxValue,
        deliveryTime: this.addHours(new Date(), shop.estimatedArrivalTime || 7),
        shippingAddress,
      };
    }

    let amountSubTotal: number = 0;
    let currency: string;

    cart.forEach((cartItem) => {
      amountSubTotal += cartItem.product.price * cartItem.quantity;
      currency = cartItem.product.currency;
    });

    // const taxValue = (amountSubTotal * shippingConfig.tax) / 100;

    return {
      amountTotal: amountSubTotal + shippingConfig.shippingFee, // + taxValue,
      amountSubTotal,
      currency,
      shippingFee: shippingConfig.shippingFee,
      shippingType: 'paid',
      // tax: taxValue,
      deliveryTime: this.addHours(new Date(), shop.estimatedArrivalTime || 7),
      shippingAddress,
    };

    // const shop = await this.shopBranchModel.findOne({ _id: new Types.ObjectId(cart[0].shop) });
    // let amountSubTotal: number = 0;
    // const shippingFee = shop.shippingFee || 20;
    // let currency: string;

    // cart.forEach((cartItem) => {
    //   const totalItemPrice = cartItem.product.price * cartItem.quantity;
    //   amountSubTotal += totalItemPrice;
    //   currency = cartItem.product.currency;
    // });

    // return {
    //   amountSubTotal,
    //   amountTotal: amountSubTotal + 10 + shippingFee,
    //   currency,
    //   shippingFee,
    //   tax: 10,
    //   deliveryTime: this.addHours(new Date(), shop.estimatedArrivalTime || 7),
    //   shippingAddress,
    // };
  }
  private addHours(date: Date, hours: number) {
    const hoursToAdd = hours * 60 * 60 * 1000;
    date.setTime(date.getTime() + hoursToAdd);
    return date;
  }

  async placeOrder(customerId: string | Types.ObjectId, placeOrderDto: PlaceOrderDto) {
    const { paymentMethodType, stripePaymentMethodId } = placeOrderDto;

    const [cart, deliveredToAddress, customer] = await Promise.all([
      this.cartModel.aggregate([
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
                    price: '$product.price',
                    quantityInStock: '$product.quantityInStock',
                    currency: '$product.currency',
                    category: '$product.category',
                    subCategory: '$product.subCategory',
                    supplier: '$product.supplier',
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
            shop: 1,
            quantity: 1,
            _id: 0,
          },
        },
      ]),
      this.customerAddressModel.findOne({ customer: new Types.ObjectId(customerId), isDefault: true }),
      this.customerModel.findById(customerId),
    ]);

    //Validate if inventory has enough quantity for each product in the cart
    // const insufficientStockItems: { productId: string; available: number; requested: number }[] = [];

    // for (const cartItem of cart) {
    //   const inStockQty = cartItem.product.quantityInStock;
    //   if (cartItem.quantity > inStockQty) {
    //     insufficientStockItems.push({
    //       productId: cartItem.product._id.toString(),
    //       available: inStockQty,
    //       requested: cartItem.quantity,
    //     });
    //   }
    // }

    // if (insufficientStockItems.length > 0) {
    //   throw new ConflictException(
    //     new CustomError({
    //       localizedMessage: {
    //         ar: 'بعض المنتجات غير متوفرة بالكميات المطلوبة',
    //         en: 'Some products are not available in the requested quantities',
    //       },
    //       event: 'INSUFFICIENT_INVENTORY',
    //       error: {
    //         invalidItems: insufficientStockItems,
    //       },
    //     }),
    //   );
    // }

    //CASH_ON_DELIVERY FLOW
    if (!cart?.length) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            ar: 'العربة فارغة، تابع التسوق',
            en: 'The cart is empty, continue shopping',
          },
          event: 'CARD_NOT_HANDLED',
        }),
      );
    }

    if (!deliveredToAddress) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            ar: 'لم يتم العثور على عنوان خاص بك',
            en: 'Your address was not found.',
          },
          event: 'ADDRESS_NOT_FOUND',
        }),
      );
    }

    const providedShop = await this.shopBranchModel.findOne({ _id: new Types.ObjectId(cart[0].shop) });

    if (!providedShop) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            ar: 'لم يتم العثور على متجر المنتجات',
            en: 'The shop of products is not found',
          },
          event: 'CARD_NOT_HANDLED',
        }),
      );
    }
    const shippingConfig = await this.shippingConfigModel.findOne();
    let amountSubTotal: number = 0;
    // let totalPriceWithVat: number = 0;
    let totalPrice: number = 0;
    let currency: string;
    let shippingType: ShippingTypeEnum;

    cart.forEach((cartItem) => {
      amountSubTotal += cartItem.product.price * cartItem.quantity;
      currency = cartItem.product.currency;
    });

    // const taxValue = (amountSubTotal * shippingConfig.tax) / 100;

    if (providedShop.isSelfShipping) {
      if (providedShop.shippingType === ShippingTypeEnum.PAID) {
        shippingType = ShippingTypeEnum.PAID;
        totalPrice = amountSubTotal + providedShop.shippingFee; // + taxValue;
      } else {
        totalPrice = amountSubTotal; //+ taxValue;
        shippingType = ShippingTypeEnum.FREE;
      }
    } else {
      totalPrice = amountSubTotal + shippingConfig.shippingFee; // + taxValue;
      shippingType = ShippingTypeEnum.PAID;
    }

    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const currentDay = weekday[today.getDay()]; // Lowercase because schedule stores days in lowercase

    let isScheduled = false;
    const currentTime = today.getTime(); // Current time in milliseconds

    for (const schedule of providedShop.schedule) {
      if (schedule.isActive && schedule.day === currentDay) {
        const endTime = new Date(schedule.endTime).getTime();

        if (currentTime > endTime) {
          isScheduled = true;
          break;
        }
      }
    }

    const categories: string[] = [];
    const subCategories: string[] = [];
    const suppliers: string[] = [];
    const shops: string[] = [];
    const orderedProducts: OrderedProductsSubSchemaType[] = [];

    cart.forEach((cartItem) => {
      if (!categories.includes(String(cartItem.product.category))) {
        categories.push(String(cartItem.product.category));
      }
      if (!subCategories.includes(String(cartItem.product.subCategory))) {
        subCategories.push(String(cartItem.product.subCategory));
      }
      if (!suppliers.includes(String(cartItem.product.supplier))) {
        suppliers.push(String(cartItem.product.supplier));
      }

      if (!shops.includes(String(cartItem.shop))) {
        shops.push(String(cartItem.shop));
      }

      orderedProducts.push({
        productId: new Types.ObjectId(cartItem.product._id),
        orderedPrice: cartItem.product.price,
        quantity: cartItem.quantity,
      });
    });

    const createdOrder = new this.orderModel({
      amountSubTotal,
      amountTotal: totalPrice,
      ...(providedShop.isSelfShipping
        ? { shippingFee: providedShop.shippingFee }
        : { shippingFee: shippingConfig.shippingFee }),
      shippingType,
      ...(providedShop.isSelfShipping ? { isShippedByShop: true } : { isShippedByShop: false }),
      currency,
      customer: new Types.ObjectId(customerId),
      deliveredToAddress: deliveredToAddress._id,
      paymentMethodType,
      paymentStatus: PaymentStatusEnum.UNPAID,
      // tax: taxValue,
      productsCategories: categories.map((category) => new Types.ObjectId(category)),
      productsSubCategories: subCategories.map((subCategory) => new Types.ObjectId(subCategory)),
      productsSuppliers: suppliers.map((supplier) => new Types.ObjectId(supplier)),
      productsProvidedShop: providedShop._id,
      orderedProducts,
      ...(isScheduled === true ? { status: OrderStatusEnum.SCHEDULED } : { status: OrderStatusEnum.PLACED }),
      ...(stripePaymentMethodId && { stripePaymentMethodId: stripePaymentMethodId }),
    });
    await createdOrder.save();

    if (stripePaymentMethodId) {
      const paymentIntent = await this.stripeService.client.paymentIntents.create({
        customer: customer.stripeCustomerId,
        amount: Math.round(totalPrice * 100), // as aed is in fils
        currency: 'aed',
        payment_method: stripePaymentMethodId,
        capture_method: 'automatic_async',
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          orderId: createdOrder._id.toString(),
        },
      });

      createdOrder.set({ stripePaymentIntentId: paymentIntent.id });
      await createdOrder.save();
    }
    if (paymentMethodType === OrderPaymentMethodTypeEnum.CASH) {
      await Promise.all(
        orderedProducts.map((product) =>
          this.inventoryModel.updateOne(
            {
              'product.productId': product.productId,
              branch: providedShop._id,
            },
            {
              $inc: {
                'product.quantityInStock': -product.quantity,
                'product.totalOrders': 1,
              },
            },
          ),
        ),
      );
    }

    await this.cartModel.deleteMany({ customer: new Types.ObjectId(customerId) });

    const populatedOrder = await this.getOrderPopulatedById(createdOrder._id, customerId);

    const branchAccessControl = await this.branchAccessControlModel.findOne({ branch: providedShop._id });

    const serviceProvider = await this.serviceProviderModel.findById(branchAccessControl?.serviceProvider);

    this.eventEmitter.emit(CustomerEventsEnum.CUSTOMER_ORDER_PLACED, { order: createdOrder, customer: customer });

    createdOrder.status === OrderStatusEnum.PLACED
      ? this.eventEmitter.emit(ServiceProviderEventsEnum.ORDER_PLACED, {
          order: createdOrder,
          serviceProvider,
          shop: providedShop,
        })
      : this.eventEmitter.emit(ServiceProviderEventsEnum.ORDER_SCHEDULED, {
          order: createdOrder,
          serviceProvider,
          shop: providedShop,
        });

    return populatedOrder;
  }

  async getOrderById(customerId: string | Types.ObjectId, { orderId }: OrderIdParamDto) {
    return this.getOrderPopulatedById(orderId, customerId);
  }

  async getMyOrders(customerId: string | Types.ObjectId, { limit, page }: BasePaginationQuery) {
    const matchStage: PipelineStage[] = [
      {
        $match: { customer: new Types.ObjectId(customerId) },
      },
    ];
    const [[{ total = 0 } = {}], orders] = await Promise.all([
      this.orderModel.aggregate(matchStage).count('total'),
      this.orderModel.aggregate([
        ...matchStage,
        { $sort: { createdAt: -1 } },
        ...addPaginationStages({ limit, page }),
        {
          $lookup: {
            from: 'basebranches',
            let: {
              productsProvidedShopId: '$productsProvidedShop',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$productsProvidedShopId'],
                  },
                },
              },
              {
                $lookup: {
                  from: 'brands',
                  let: { brandId: '$brand' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$_id', '$$brandId'],
                        },
                      },
                    },
                    {
                      $project: {
                        name: 1,
                        logoPictureMedia: 1,
                      },
                    },
                  ],
                  as: 'brand',
                },
              },
              {
                $unwind: {
                  path: '$brand',
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $project: {
                  name: '$brand.name',
                  logoPictureMedia: '$brand.logoPictureMedia',
                  estimatedArrivalTime: 1,
                  estimatedArrivalUnit: 1,
                  shippingType: 1,
                },
              },
            ],
            as: 'productsProvidedShop',
          },
        },
        {
          $unwind: {
            path: '$productsProvidedShop',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            productsProvidedShop: 1,
            generatedUniqueId: 1,
            status: 1,
            rating: 1,
          },
        },
      ]),
    ]);

    return { data: orders, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getOrderPopulatedById(orderId: string | Types.ObjectId, customerId: string | Types.ObjectId) {
    const [order] = await this.orderModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(orderId), customer: new Types.ObjectId(customerId) },
      },
      {
        $unwind: {
          path: '$orderedProducts',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'inventories',
          let: {
            productId: '$orderedProducts.productId',
            shopId: '$productsProvidedShop',
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
              $project: {
                _id: 0,
                product: 1,
              },
            },
          ],
          as: 'orderedProducts',
        },
      },
      {
        $unwind: {
          path: '$orderedProducts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'customeraddresses',
          let: {
            deliveredToAddressId: '$deliveredToAddress',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$deliveredToAddressId'],
                },
              },
            },
            {
              $lookup: {
                from: 'countries',
                let: {
                  countryId: '$country',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$_id',
                          {
                            $ifNull: ['$$countryId', null],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: 'country',
              },
            },
            {
              $unwind: {
                path: '$country',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'cities',
                let: {
                  cityId: '$city',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$_id',
                          {
                            $ifNull: ['$$cityId', null],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: 'city',
              },
            },
            {
              $unwind: {
                path: '$city',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'areas',
                let: {
                  areaId: '$area',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$_id',
                          {
                            $ifNull: ['$$areaId', null],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: 'area',
              },
            },
            {
              $unwind: {
                path: '$area',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                city: 1,
                country: 1,
                area: 1,
                streetName: 1,
                location: 1,
                isDefault: 1,
                labelName: 1,
                addressType: 1,
                phoneNumber: 1,
                buildingName: 1,
                apartmentNumber: 1,
                floor: 1,
                additionalNotes: 1,
                landMark: 1,
                houseName: 1,
                companyName: 1,
              },
            },
          ],
          as: 'deliveredToAddress',
        },
      },
      {
        $unwind: {
          path: '$deliveredToAddress',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'basebranches',
          let: {
            productsProvidedShopId: '$productsProvidedShop',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$productsProvidedShopId'],
                },
              },
            },
            {
              $lookup: {
                from: 'brands',
                let: { brandId: '$brand' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$brandId'],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                      logoPictureMedia: 1,
                    },
                  },
                ],
                as: 'brand',
              },
            },
            {
              $unwind: {
                path: '$brand',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                name: '$brand.name',
                logoPictureMedia: '$brand.logoPictureMedia',
                isSelfShipping: 1,
                shippingFee: 1,
                estimatedArrivalTime: 1,
                estimatedArrivalUnit: 1,
                shippingType: 1,
              },
            },
          ],
          as: 'productsProvidedShop',
        },
      },
      {
        $unwind: {
          path: '$productsProvidedShop',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          productsProvidedShop: 1,
          deliveredToAddress: 1,
          generatedUniqueId: 1,
          orderedProducts: 1,
          status: 1,
          paymentMethodType: 1,
          currency: 1,
          amountSubTotal: 1,
          amountTotal: 1,
          shippingFee: 1,
          apartmentNumber: 1,
          tax: 1,
          additionalNotes: 1,
          landMark: 1,
          houseName: 1,
          companyName: 1,
          stripePaymentMethodId: 1,
          rating: 1,
        },
      },
    ]);
    if (!order) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'لم يتم العثور على طلب',
            en: 'Order not found',
          },
          event: 'ORDER_NOT_FOUND',
        }),
      );
    }

    if (order.paymentMethodType === OrderPaymentMethodTypeEnum.CARD && order.stripePaymentMethodId) {
      const paymentMethod = await this.stripeService.client.paymentMethods.retrieve(order.stripePaymentMethodId);

      return {
        ...order,
        paymentMethod: this.formatPaymentMethod(paymentMethod),
      };
    }

    return order;
  }
  private formatPaymentMethod(paymentMethod: Stripe.PaymentMethod) {
    return {
      _id: paymentMethod?.id,
      type: paymentMethod?.type,
      card: {
        brand: paymentMethod?.card?.brand,
        display_brand: paymentMethod?.card?.brand,
        last4: paymentMethod?.card?.last4,
        expMonth: paymentMethod?.card?.exp_month,
        expYear: paymentMethod?.card?.exp_year,
      },
    };
  }
}
