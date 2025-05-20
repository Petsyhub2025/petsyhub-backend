import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ModelNames } from '@common/constants';
import {
  addPaginationStages,
  BasePaginationQuery,
  CustomError,
  IOrderModel,
  IShippingConfigModel,
} from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { OrderIdParamDto } from '@orders/shared/dto/order-id-param.dto';
import { UpdateShippingConfigDto } from './dto/update-shipping-config.dto';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ModelNames.ORDER) private readonly orderModel: IOrderModel,
    @Inject(ModelNames.SHIPPING_CONFIG) private readonly shippingConfigModel: IShippingConfigModel,
  ) {}

  async getShippingConfig() {
    return this.shippingConfigModel.findOne();
  }

  async updateShippingConfig(body: UpdateShippingConfigDto) {
    const savedShippingConfig = await this.shippingConfigModel.findOne();
    const updatedShippingConfig = savedShippingConfig || new this.shippingConfigModel();
    updatedShippingConfig.set(body);
    await updatedShippingConfig.save();
  }
  async getOrders({ limit, page }: BasePaginationQuery) {
    const matchStage: PipelineStage[] = [
      {
        $match: {},
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
            productsProvidedShop: 1,
          },
        },
      ]),
    ]);

    return { data: orders, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getOrderDetails(serviceProviderId: string | Types.ObjectId, { orderId }: OrderIdParamDto) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(orderId),
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
                media: '$product.media',
                name: '$product.name',
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
          productsProvidedShop: 1,
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
}
