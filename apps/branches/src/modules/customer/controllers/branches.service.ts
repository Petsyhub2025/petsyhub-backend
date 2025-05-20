import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BranchStatusEnum,
  BranchTypeEnum,
  CustomError,
  Customer,
  CustomerAddress,
  ErrorType,
  IBaseBranchModel,
  ICustomerModel,
  ModelNames,
  addPaginationStages,
} from '@instapets-backend/common';
import { HydratedDocument, Types } from 'mongoose';
import { GetNearByShopsQueryDto } from './dto/get-nearby-shops.dto';
import { GetNearByShopQueryDto } from './dto/get-nearby-shop.dto';
import { ShopIdParamDto } from '@branches/customer/shared/dto/shop-id-param.dto';

@Injectable()
export class BranchesService {
  private METERS_TO_KM = 1000;

  constructor(
    @Inject(ModelNames.BASE_BRANCH)
    private readonly baseBranchModel: IBaseBranchModel,
    @Inject(ModelNames.CUSTOMER) private readonly customerModel: ICustomerModel,
  ) {}

  async getNearByShops(query: GetNearByShopsQueryDto, customerId?: string | Types.ObjectId) {
    const { page = 1, limit = 20, lat, lng } = query;

    const queryFilter = {
      branchType: BranchTypeEnum.SHOP,
      status: BranchStatusEnum.APPROVED,
    };

    //eslint-disable-next-line
    let [[{ total = 0 } = {}], docs] = await Promise.all([
      this.baseBranchModel
        .aggregate([
          {
            $match: { ...queryFilter },
          },
        ])
        .count('total'),
      this.baseBranchModel.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            query: { ...queryFilter },
            distanceMultiplier: 0.001,
            maxDistance: 70 * this.METERS_TO_KM,
          },
        },
        ...addPaginationStages({ limit, page }),
        {
          $lookup: {
            from: 'inventories',
            let: { branchId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$branch', '$$branchId'],
                  },
                },
              },
            ],
            as: 'savedProducts',
          },
        },
        {
          $match: {
            savedProducts: { $ne: [] },
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
            distance: {
              $cond: [
                { $eq: ['$distance', null] },
                null,
                {
                  $concat: [
                    {
                      $toString: {
                        $round: ['$distance', 1],
                      },
                    },
                    ' KM',
                  ],
                },
              ],
            },
            rating: 1,
            totalRatings: 1,
          },
        },
      ]),
    ]);

    return {
      data: docs,
      ...(docs?.length > 0 ? { total } : { total: 0 }),
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getNearByShopById(
    { shopId }: ShopIdParamDto,
    query: GetNearByShopQueryDto,
    customerId?: string | Types.ObjectId,
  ) {
    const { lat, lng } = query;
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDay = weekday[today.getDay()].toLocaleLowerCase();

    const queryFilter = {
      branchType: BranchTypeEnum.SHOP,
      status: BranchStatusEnum.APPROVED,
      _id: new Types.ObjectId(shopId),
    };

    const [shop] = await this.baseBranchModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          query: { ...queryFilter },
          distanceMultiplier: 0.001,
          maxDistance: 70 * this.METERS_TO_KM,
        },
      },
      {
        $lookup: {
          from: 'inventories',
          let: { branchId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$branch', '$$branchId'],
                },
              },
            },
          ],
          as: 'savedProducts',
        },
      },
      {
        $match: {
          savedProducts: { $ne: [] },
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
        $addFields: {
          operatingHours: {
            $filter: {
              input: '$schedule',
              as: 'scheduleItem',
              cond: { $eq: ['$$scheduleItem.day', currentDay] },
            },
          },
        },
      },
      {
        $unwind: {
          path: '$operatingHours',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$brand.name',
          logoPictureMedia: '$brand.logoPictureMedia',
          distance: {
            $cond: [
              { $eq: ['$distance', null] },
              null,
              {
                $concat: [
                  {
                    $toString: {
                      $round: ['$distance', 1],
                    },
                  },
                  ' KM',
                ],
              },
            ],
          },
          rating: 1,
          totalRatings: 1,
          streetAddress: 1,
          phoneNumber: 1,
          operatingHours: 1,
          location: 1,
        },
      },
    ]);

    if (!shop) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Shop not found',
            ar: 'الفرع غير موجود',
          },
          event: 'SHOP_NOT_FOUND',
        }),
      );
    }

    return shop;
  }

  private async getCustomerActiveAddress(
    customerId: string | Types.ObjectId,
  ): Promise<Customer & { activeAddress: HydratedDocument<CustomerAddress> }> {
    const [customer] = await this.customerModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(customerId),
        },
      },
      {
        $lookup: {
          from: 'customeraddresses',
          let: { addressId: '$activeAddress' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$addressId'],
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
                streetAddress: 1,
                location: 1,
              },
            },
          ],
          as: 'activeAddress',
        },
      },
      {
        $unwind: {
          path: '$activeAddress',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          activeAddress: 1,
        },
      },
    ]);

    if (!customer) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Unauthorized',
            ar: 'غير مصرح به هذا الإجراء',
          },
          errorType: ErrorType.UNAUTHORIZED,
          event: 'UNAUTHORIZED_EXCEPTION',
        }),
      );
    }
    return customer;
  }
}
