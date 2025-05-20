import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ModelNames } from '@common/constants';
import {
  addPaginationStages,
  CustomerEventsEnum,
  CustomError,
  IBaseBranchModel,
  IOrderModel,
  IServiceProviderModel,
  OrderStatusEnum,
  ServiceProviderEventsEnum,
} from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { GetOrdersDto } from './dto/get-orders.dto';
import { BranchIdQueryDto } from '@orders/shared/dto/branch-id-query.dto';
import { OrderIdParamDto } from '@orders/shared/dto/order-id-param.dto';
import { UpdateOrderStatusDto } from './dto/udpate-order-status.dto';
import { OrderStatusEnumValidator } from './order-status-validator.service';
import { UpdateOrderPaymentStatusDto } from './dto/udpate-order-payment-status.dto';
import { GetOrdersAnalyticsDto } from './dto/orders-analytics.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ModelNames.ORDER) private readonly orderModel: IOrderModel,
    @Inject(ModelNames.BASE_BRANCH) private readonly branchModel: IBaseBranchModel,
    @Inject(ModelNames.SERVICE_PROVIDER) private readonly serviceProviderModel: IServiceProviderModel,
    private orderStatusValidator: OrderStatusEnumValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getOrders({ limit, page, status, branchId }: GetOrdersDto) {
    if (!branchId) {
      return { data: [], total: 0, limit, page, pages: 0 };
    }
    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(status && { status }),
          productsProvidedShop: new Types.ObjectId(branchId),
        },
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
            from: 'customers',
            let: { customerId: '$customer' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$customerId'],
                  },
                },
              },
              {
                $addFields: {
                  username: {
                    $concat: ['$firstName', ' ', '$lastName'],
                  },
                },
              },
              {
                $project: {
                  username: 1,
                },
              },
            ],
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'customeraddresses',
            let: { deliveredToAddressId: '$deliveredToAddress' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$deliveredToAddressId'],
                  },
                },
              },
              {
                $project: {
                  phoneNumber: 1,
                },
              },
            ],
            as: 'deliveredToAddress',
          },
        },
        {
          $unwind: {
            path: '$deliveredToAddress',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            itemsCount: { $size: '$orderedProducts' },
          },
        },
        {
          $project: {
            generatedUniqueId: 1,
            createdAt: 1,
            status: 1,
            paymentStatus: 1,
            paymentMethodType: 1,
            amountTotal: 1,
            currency: 1,
            itemsCount: 1,
            customer: 1,
            phoneNumber: '$deliveredToAddress.phoneNumber',
          },
        },
      ]),
    ]);

    return { data: orders, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getOrderDetails(
    serviceProviderId: string | Types.ObjectId,
    { orderId }: OrderIdParamDto,
    { branchId }: BranchIdQueryDto,
  ) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(orderId),
          productsProvidedShop: new Types.ObjectId(branchId),
        },
      },
    ];
    const [order] = await this.orderModel.aggregate([
      ...matchStage,
      {
        $lookup: {
          from: 'customers',
          let: { customerId: '$customer' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$customerId'],
                },
              },
            },
            {
              $addFields: {
                username: {
                  $concat: ['$firstName', ' ', '$lastName'],
                },
              },
            },
            {
              $unwind: {
                path: '$ownedPets',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'pets',
                let: { petId: '$ownedPets.petId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$petId'],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'pettypes',
                      let: {
                        type: '$type',
                      },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $eq: ['$_id', '$$type'],
                            },
                          },
                        },
                        {
                          $project: {
                            name: 1,
                          },
                        },
                      ],
                      as: 'type',
                    },
                  },
                  {
                    $unwind: {
                      path: '$type',
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $project: { name: 1, type: 1 },
                  },
                ],
                as: 'ownedPets',
              },
            },

            {
              $project: {
                username: 1,
                email: 1,
                phoneNumber: 1,
                ownedPets: 1,
              },
            },
          ],
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
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
        $addFields: {
          itemsCount: { $size: '$orderedProducts' },
        },
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
            quantity: '$orderedProducts.quantity',
            orderedPrice: '$orderedProducts.orderedPrice',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product.productId', { $ifNull: ['$$productId', null] }] },
                    { $eq: ['$branch', { $ifNull: ['$$shopId', null] }] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'products',
                let: { prodId: '$product.productId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$prodId'],
                      },
                    },
                  },
                  {
                    $project: {
                      sku: 1,
                    },
                  },
                ],
                as: 'productDetails',
              },
            },
            {
              $unwind: {
                path: '$productDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                media: '$product.media',
                name: '$product.name',
                sku: '$productDetails.sku',
                quantity: '$$quantity',
                orderedPrice: '$$orderedPrice',
              },
            },
          ],
          as: 'orderedProducts',
        },
      },
      {
        $addFields: {
          orderedProducts: {
            $map: {
              input: '$orderedProducts',
              as: 'item',
              in: {
                name: '$$item.name',
                media: '$$item.media',
                sku: '$$item.sku',
                quantity: '$$item.quantity',
                pricePerItem: '$$item.orderedPrice',
                totalItemsPrice: {
                  $multiply: ['$$item.orderedPrice', '$$item.quantity'],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          generatedUniqueId: 1,
          createdAt: 1,
          status: 1,
          paymentStatus: 1,
          paymentMethodType: 1,
          amountTotal: 1,
          amountSubTotal: 1,
          currency: 1,
          itemsCount: 1,
          customer: 1,
          deliveredToAddress: 1,
          orderedProducts: 1,
          shippingFee: 1,
        },
      },
    ]);

    if (!order) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Order not found',
            ar: 'الطلب غير موجود',
          },
          event: 'ORDER_NOT_FOUND',
        }),
      );
    }

    return order;
  }

  async updateOrderStatus(
    serviceProviderId: string | Types.ObjectId,
    { orderId }: OrderIdParamDto,
    { status, branchId }: UpdateOrderStatusDto,
  ) {
    const order = await this.orderModel.findById(orderId);
    const shop = await this.branchModel.findById(branchId);
    const serviceProvider = await this.serviceProviderModel.findById(serviceProviderId);

    if (!order)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'الطلب غير موجود',
            en: 'Order not found',
          },
          error: 'ORDER_NOT_FOUND',
          event: 'ORDER_NOT_FOUND',
        }),
      );

    this.orderStatusValidator.isStatusValidForOrder(order, status);

    order.status = status;
    await order.save();

    switch (status) {
      case OrderStatusEnum.PROCESSING:
        this.eventEmitter.emit(ServiceProviderEventsEnum.ORDER_PROCESSING, { order, serviceProvider, shop });
        break;
      case OrderStatusEnum.OUT_FOR_DELIVERY:
        this.eventEmitter.emit(CustomerEventsEnum.CUSTOMER_ORDER_OUT_FOR_DELIVERY, order);
        this.eventEmitter.emit(ServiceProviderEventsEnum.ORDER_OUT_FOR_DELIVERY, { order, serviceProvider, shop });
        break;
      case OrderStatusEnum.DELIVERED:
        this.eventEmitter.emit(CustomerEventsEnum.CUSTOMER_ORDER_DELIVERED, order);
        this.eventEmitter.emit(ServiceProviderEventsEnum.ORDER_DELIVERED, { order, serviceProvider, shop });
        break;
      case OrderStatusEnum.COMPLETED:
        this.eventEmitter.emit(ServiceProviderEventsEnum.ORDER_COMPLETED, { order, serviceProvider, shop });
        break;
      // Add additional cases if needed for other statuses
      default:
        break;
    }
  }

  async updateOrderPaymentStatus(
    serviceProviderId: string | Types.ObjectId,
    { orderId }: OrderIdParamDto,
    { status }: UpdateOrderPaymentStatusDto,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'الطلب غير موجود',
            en: 'Order not found',
          },
          error: 'ORDER_NOT_FOUND',
          event: 'ORDER_NOT_FOUND',
        }),
      );

    order.paymentStatus = status;
    await order.save();
  }

  async getOrderAnalytics(serviceProviderId: string | Types.ObjectId, { branchId }: GetOrdersAnalyticsDto) {
    if (!branchId) {
      return {};
    }

    const [totalSells, averageValue, totalOrders, topSellingProducts, salesPerformance, bestSuppliers, recentOrders] =
      await Promise.all([
        this.getTotalSellsDifference(branchId),
        this.getAverageOrderValue(branchId),
        this.getTotalOrders(branchId),
        this.topSellingProducts(branchId),
        this.getSalesPerformance(branchId),
        this.getBestSuppliers(branchId),
        this.getRecentOrders(branchId),
      ]);

    return {
      totalSells,
      averageValue,
      totalOrders,
      topSellingProducts,
      salesPerformance,
      bestSuppliers,
      recentOrders,
    };
  }
  private async getTotalSellsDifference(branchId: string | Types.ObjectId) {
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth();

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const [[totalSellsCurrentMonth], [totalSellsPreviousMonth]] = await Promise.all([
      this.orderModel.aggregate([
        {
          $match: {
            productsProvidedShop: new Types.ObjectId(branchId),
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%B',
                    date: '$createdAt',
                    timezone: '+04:30',
                  },
                },
                monthNames[currentMonth],
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%B',
                date: '$createdAt',
                timezone: '+04:30',
              },
            },
            totalSaleAmount: {
              $sum: '$amountTotal',
            },
            currency: { $first: '$currency' },
          },
        },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            productsProvidedShop: new Types.ObjectId(branchId),
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%B',
                    date: '$createdAt',
                    timezone: '+04:30',
                  },
                },
                monthNames[previousMonth],
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%B',
                date: '$createdAt',
                timezone: '+04:30',
              },
            },
            totalSaleAmount: {
              $sum: '$amountTotal',
            },
            currency: { $first: '$currency' },
          },
        },
      ]),
    ]);
    if (totalSellsPreviousMonth) {
      const difference = totalSellsCurrentMonth?.totalSaleAmount - totalSellsPreviousMonth?.totalSaleAmount;
      const percentageChange = (difference / totalSellsPreviousMonth?.totalSaleAmount) * 100;
      return {
        ...(totalSellsCurrentMonth?.totalSaleAmount > totalSellsPreviousMonth?.totalSaleAmount
          ? { growth: 'up' }
          : { growth: 'down' }),
        percentageChange: percentageChange.toFixed(2) + '%',
        totalSells: totalSellsCurrentMonth?.totalSaleAmount,
        currency: totalSellsCurrentMonth?.currency,
      };
    }
    return {
      growth: 'up',
      percentageChange: '100%',
      totalSells: totalSellsCurrentMonth?.totalSaleAmount,
      currency: totalSellsCurrentMonth?.currency,
    };
  }
  private async getAverageOrderValue(branchId: string | Types.ObjectId) {
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth();

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const [[averageOrderValueCurrentMonth], [averageOrderValuePreviousMonth]] = await Promise.all([
      this.orderModel.aggregate([
        {
          $match: {
            productsProvidedShop: new Types.ObjectId(branchId),
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%B',
                    date: '$createdAt',
                    timezone: '+04:30',
                  },
                },
                monthNames[currentMonth],
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%B',
                date: '$createdAt',
                timezone: '+04:30',
              },
            },
            totalSaleAmount: {
              $avg: '$amountTotal',
            },
            currency: { $first: '$currency' },
          },
        },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            productsProvidedShop: new Types.ObjectId(branchId),
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%B',
                    date: '$createdAt',
                    timezone: '+04:30',
                  },
                },
                monthNames[previousMonth],
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%B',
                date: '$createdAt',
                timezone: '+04:30',
              },
            },
            totalSaleAmount: {
              $avg: '$amountTotal',
            },
            currency: { $first: '$currency' },
          },
        },
      ]),
    ]);
    if (averageOrderValuePreviousMonth) {
      const difference =
        averageOrderValueCurrentMonth?.totalSaleAmount - averageOrderValuePreviousMonth?.totalSaleAmount;
      const percentageChange = (difference / averageOrderValuePreviousMonth?.totalSaleAmount) * 100;
      return {
        ...(averageOrderValueCurrentMonth?.totalSaleAmount > averageOrderValuePreviousMonth?.totalSaleAmount
          ? { growth: 'up' }
          : { growth: 'down' }),
        percentageChange: percentageChange.toFixed(2) + '%',
        averageValue: averageOrderValueCurrentMonth?.totalSaleAmount,
        currency: averageOrderValueCurrentMonth?.currency,
      };
    }
    return {
      growth: 'up',
      percentageChange: '100%',
      averageValue: averageOrderValueCurrentMonth?.totalSaleAmount,
      currency: averageOrderValueCurrentMonth?.currency,
    };
  }
  private async getTotalOrders(branchId: string | Types.ObjectId) {
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth();

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const [[totalOrderValueCurrentMonth], [totalOrderValuePreviousMonth]] = await Promise.all([
      this.orderModel.aggregate([
        {
          $match: {
            productsProvidedShop: new Types.ObjectId(branchId),
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%B',
                    date: '$createdAt',
                    timezone: '+04:30',
                  },
                },
                monthNames[currentMonth],
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%B',
                date: '$createdAt',
                timezone: '+04:30',
              },
            },
            count: { $count: {} },
            currency: { $first: '$currency' },
          },
        },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            productsProvidedShop: new Types.ObjectId(branchId),
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%B',
                    date: '$createdAt',
                    timezone: '+04:30',
                  },
                },
                monthNames[previousMonth],
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%B',
                date: '$createdAt',
                timezone: '+04:30',
              },
            },
            count: { $count: {} },
            currency: { $first: '$currency' },
          },
        },
      ]),
    ]);
    if (totalOrderValuePreviousMonth) {
      const difference = totalOrderValueCurrentMonth?.count - totalOrderValuePreviousMonth?.count;
      const percentageChange = (difference / totalOrderValuePreviousMonth?.count) * 100;
      return {
        ...(totalOrderValueCurrentMonth?.count > totalOrderValuePreviousMonth?.count
          ? { growth: 'up' }
          : { growth: 'down' }),
        percentageChange: percentageChange.toFixed(2) + '%',
        count: totalOrderValueCurrentMonth?.count,
        currency: totalOrderValueCurrentMonth?.currency,
      };
    }

    return {
      growth: 'up',
      percentageChange: '100%',
      count: totalOrderValueCurrentMonth?.count,
      currency: totalOrderValueCurrentMonth?.currency,
    };
  }

  private async topSellingProducts(branchId: string | Types.ObjectId) {
    const matchStage = [
      {
        $match: { productsProvidedShop: new Types.ObjectId(branchId) },
      },
    ];
    const [[{ total = 0 } = {}], products] = await Promise.all([
      this.orderModel.aggregate(matchStage).count('total'),
      this.orderModel.aggregate([
        ...matchStage,
        { $unwind: '$orderedProducts' },
        {
          $group: {
            _id: '$orderedProducts.productId',
            ordersCount: { $sum: 1 },
          },
        },
        { $sort: { orderCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            let: { productId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$productId'],
                  },
                },
              },
              {
                $project: { name: 1 },
              },
            ],
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            _id: 0,
            product: 1,
            ordersCount: 1,
          },
        },
      ]),
    ]);

    return {
      total,
      products,
    };
  }

  async getSalesPerformance(branchId: string | Types.ObjectId) {
    const matchStage = [
      {
        $match: { productsProvidedShop: new Types.ObjectId(branchId) },
      },
    ];

    const [maximumAmount] = await this.orderModel.aggregate([
      {
        $sort: {
          amountTotal: -1,
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          amountTotal: 1,
          currency: 1,
        },
      },
    ]);
    const totalSalesPerformance = await this.orderModel.aggregate([
      ...matchStage,
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%B',
              date: '$createdAt',
              timezone: '+04:30',
            },
          },
          totalSales: { $sum: '$amountTotal' }, // Sum total amount per month
          currency: { $first: '$currency' },
        },
      },
    ]);

    return { maximumAmount: maximumAmount.amountTotal, currency: maximumAmount.currency, totalSalesPerformance };
  }

  async getBestSuppliers(branchId: string | Types.ObjectId) {
    const matchStage = [
      {
        $match: { productsProvidedShop: new Types.ObjectId(branchId) },
      },
    ];

    const bestSuppliers = await this.orderModel.aggregate([
      ...matchStage,
      {
        $unwind: '$productsSuppliers', // Unwind the suppliers array
      },
      {
        $group: {
          _id: '$productsSuppliers', // Group by supplier ID
          totalOrders: { $sum: 1 }, // Count the number of orders per supplier
          totalAmount: { $sum: '$amountTotal' }, // Sum the total sales amount
        },
      },
      {
        $lookup: {
          from: 'brands', // Assuming a suppliers collection exists
          localField: '_id',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      {
        $unwind: '$supplier',
      },
      {
        $project: {
          _id: 0,
          supplier: '$supplier.name',
          orders: '$totalOrders',
          amount: '$totalAmount',
        },
      },
      { $sort: { amount: -1 } },
    ]);

    return bestSuppliers;
  }

  async getRecentOrders(branchId: string | Types.ObjectId) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          productsProvidedShop: new Types.ObjectId(branchId),
        },
      },
    ];
    const recentOrders = this.orderModel.aggregate([
      ...matchStage,
      { $sort: { createdAt: -1 } },
      {
        $limit: 6,
      },
      {
        $lookup: {
          from: 'customers',
          let: { customerId: '$customer' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$customerId'],
                },
              },
            },
            {
              $addFields: {
                username: {
                  $concat: ['$firstName', ' ', '$lastName'],
                },
              },
            },
            {
              $project: {
                username: 1,
              },
            },
          ],
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          generatedUniqueId: 1,
          createdAt: 1,
          status: 1,
          amountTotal: 1,
          currency: 1,
          customer: 1,
        },
      },
    ]);

    return recentOrders;
  }
}
