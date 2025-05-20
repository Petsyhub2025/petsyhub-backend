import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CustomError,
  ErrorType,
  ICustomerModel,
  IOrderModel,
  ModelNames,
  addPaginationStages,
} from '@instapets-backend/common';
import { GetCustomersQueryDto } from './dto/get-customers.dto';
import { Types } from 'mongoose';
import { CustomerIdParamDto } from '@customers/serviceprovider/shared/dto/customer-id-param.dto';
import { BranchIdQueryDto } from '@customers/serviceprovider/shared/dto/branch-id-query.dto';
import { GetCustomersOrdersQueryDto } from './dto/get-customers-orders.dto';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(ModelNames.CUSTOMER) private customerModel: ICustomerModel,
    @Inject(ModelNames.ORDER) private orderModel: IOrderModel,
  ) {}

  async getCustomers(serviceProviderId: string, query: GetCustomersQueryDto) {
    const { page, limit, branchId } = query;

    if (!branchId) {
      return {
        data: [],
        total: 0,
        limit,
        page,
        pages: 0,
      };
    }
    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.customerModel
        .aggregate([
          {
            $lookup: {
              from: 'orders',
              let: { customerId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $and: [
                      {
                        $expr: {
                          $eq: ['$customer', '$$customerId'],
                        },
                      },
                      {
                        productsProvidedShop: new Types.ObjectId(branchId),
                      },
                    ],
                  },
                },
                {
                  $project: {
                    amountTotal: 1,
                    currency: 1,
                  },
                },
              ],
              as: 'orders',
            },
          },
          {
            $match: {
              orders: { $ne: [] },
            },
          },
        ])
        .count('total'),
      this.customerModel.aggregate([
        {
          $lookup: {
            from: 'orders',
            let: { customerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $eq: ['$customer', '$$customerId'],
                      },
                    },
                    {
                      productsProvidedShop: new Types.ObjectId(branchId),
                    },
                  ],
                },
              },
              {
                $project: {
                  amountTotal: 1,
                  currency: 1,
                },
              },
            ],
            as: 'orders',
          },
        },
        {
          $match: {
            orders: { $ne: [] },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        {
          $lookup: {
            from: 'customeraddresses',
            let: {
              activeAddressId: '$activeAddress',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$activeAddressId'],
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
            ],
            as: 'activeAddress',
          },
        },
        {
          $unwind: {
            path: '$activeAddress',
            preserveNullAndEmptyArrays: false,
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
            email: 1,
            country: '$activeAddress.country',
            createdAt: 1,
            phoneNumber: 1,
            totalSpent: { $sum: '$orders.amountTotal' },
            currency: {
              $cond: {
                if: { $eq: [{ $size: '$orders' }, 0] },
                then: '',
                else: {
                  $arrayElemAt: ['$orders.currency', 0],
                },
              },
            },
          },
        },
      ]),
    ]);

    return {
      data: docs,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getCustomerDetails(
    serviceProviderId: string,
    { customerId }: CustomerIdParamDto,
    { branchId }: BranchIdQueryDto,
  ) {
    const matchStage = [
      {
        $match: { _id: new Types.ObjectId(customerId) },
      },
    ];

    const [doc] = await Promise.all([
      this.customerModel.aggregate([
        ...matchStage,
        {
          $lookup: {
            from: 'customeraddresses',
            let: {
              customerId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$customer', '$$customerId'],
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
            as: 'addresses',
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
          $lookup: {
            from: 'orders',
            let: { customerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $eq: ['$customer', '$$customerId'],
                      },
                    },
                    {
                      productsProvidedShop: new Types.ObjectId(branchId),
                    },
                  ],
                },
              },
              {
                $sort: { createdAt: -1 },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  generatedUniqueId: 1,
                  createdAt: 1,
                },
              },
            ],
            as: 'lastOrder',
          },
        },
        {
          $unwind: {
            path: '$lastOrder',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'orders',
            let: { customerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $eq: ['$customer', '$$customerId'],
                      },
                    },
                    {
                      productsProvidedShop: new Types.ObjectId(branchId),
                    },
                  ],
                },
              },
              {
                $project: {
                  amountTotal: 1,
                  currency: 1,
                },
              },
            ],
            as: 'orders',
          },
        },
        {
          $addFields: {
            averageOrderValue: {
              $ifNull: [{ $avg: '$orders.amountTotal' }, 0],
            },
          },
        },
        {
          $project: {
            username: 1,
            email: 1,
            createdAt: 1,
            phoneNumber: 1,
            lastOrder: 1,
            averageOrderValue: 1,
            currency: {
              $cond: {
                if: { $eq: [{ $size: '$orders' }, 0] },
                then: '',
                else: {
                  $arrayElemAt: ['$orders.currency', 0],
                },
              },
            },
            addresses: 1,
          },
        },
      ]),
    ]);
    if (!doc) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Customer not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'CUSTOMER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    return doc;
  }

  async getCustomersOrders(
    serviceProviderId: string,
    { customerId }: CustomerIdParamDto,
    { branchId, limit, page }: GetCustomersOrdersQueryDto,
  ) {
    const matchStage = [
      {
        $match: { customer: new Types.ObjectId(customerId), productsProvidedShop: new Types.ObjectId(branchId) },
      },
    ];

    const [[{ total = 0 } = {}], orders, totalSpentDocs] = await Promise.all([
      this.orderModel.aggregate(matchStage).count('total'),
      this.orderModel.aggregate([
        ...matchStage,
        {
          $sort: { createdAt: -1 },
        },
        ...addPaginationStages({ limit, page }),
        {
          $project: {
            generatedUniqueId: 1,
            createdAt: 1,
            status: 1,
            itemsCount: { $size: '$orderedProducts' },
            amountTotal: 1,
            currency: 1,
          },
        },
      ]),
      this.orderModel.aggregate([
        ...matchStage,
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amountTotal' },
          },
        },
      ]),
    ]);
    return {
      data: orders,
      total,
      ...(totalSpentDocs?.length && { totalSpent: totalSpentDocs[0].totalSpent }),
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
