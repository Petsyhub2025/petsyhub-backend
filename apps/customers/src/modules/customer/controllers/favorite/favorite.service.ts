import { Inject, Injectable } from '@nestjs/common';
import { ModelNames } from '@common/constants';
import {
  addPaginationStages,
  BranchStatusEnum,
  BranchTypeEnum,
  FavoriteTypeEnum,
  IBaseBranchModel,
  IFavoriteModel,
  IInventoryModel,
  IProductModel,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { AddToFavoriteDto } from './dto/add-to-favorite.dto';
import { GetFavoritesQueryDto } from './dto/get-favorites.dto';

@Injectable()
export class FavoriteService {
  constructor(
    @Inject(ModelNames.PRODUCT) private readonly productModel: IProductModel,
    @Inject(ModelNames.FAVORITE) private readonly favoriteModel: IFavoriteModel,
    @Inject(ModelNames.INVENTORY) private readonly inventoryModel: IInventoryModel,
    @Inject(ModelNames.BASE_BRANCH) private readonly baseBranchModel: IBaseBranchModel,
  ) {}

  async addToFavorite(customerId: string | Types.ObjectId, { favoriteType, productId, shopId }: AddToFavoriteDto) {
    const createdFav = new this.favoriteModel({
      customer: new Types.ObjectId(customerId),
      favoriteType,
      ...(favoriteType === FavoriteTypeEnum.PRICED_PRODUCT && {
        product: new Types.ObjectId(productId),
        shop: new Types.ObjectId(shopId),
      }),
      ...(favoriteType === FavoriteTypeEnum.PRODUCT && {
        product: new Types.ObjectId(productId),
      }),
      ...(favoriteType === FavoriteTypeEnum.SHOP && {
        shop: new Types.ObjectId(shopId),
      }),
    });

    await createdFav.save();
  }

  async getFavorites(
    customerId: string | Types.ObjectId,
    { favoriteType, limit, page, lat, lng }: GetFavoritesQueryDto,
  ) {
    let result: { data: any[]; total: any; limit: number; page: number; pages: number };

    const matchStage = [
      {
        $match: {
          favoriteType,
        },
      },
    ];
    switch (favoriteType) {
      case FavoriteTypeEnum.PRODUCT:
        const [[{ total = 0 } = {}], docs] = await Promise.all([
          this.favoriteModel.aggregate([...matchStage]).count('total'),
          this.favoriteModel.aggregate([
            ...matchStage,
            ...addPaginationStages({ page, limit }),
            {
              $lookup: {
                from: 'products',
                let: { productId: '$product' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$productId'],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'inventories',
                      localField: '_id',
                      foreignField: 'product.productId',
                      as: 'inventoryProducts',
                    },
                  },
                  {
                    $match: {
                      inventoryProducts: { $ne: [] },
                    },
                  },
                  { $project: { name: 1, media: 1 } },
                ],
                as: 'products',
              },
            },
            { $unwind: '$products' }, // Flatten the products array
            { $replaceRoot: { newRoot: '$products' } }, // Set products as the root
          ]),
        ]);

        result = { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
        break;
      case FavoriteTypeEnum.PRICED_PRODUCT:
        const [[{ totalPriced = 0 } = {}], pricedProducts] = await Promise.all([
          this.favoriteModel.aggregate([...matchStage]).count('totalPriced'),
          this.favoriteModel.aggregate([
            ...matchStage,
            ...addPaginationStages({ page, limit }),
            {
              $lookup: {
                from: 'inventories',
                let: { productId: '$product', shopId: '$shop' },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        {
                          $expr: {
                            $eq: ['$product.productId', '$$productId'],
                          },
                        },
                        {
                          $expr: {
                            $eq: ['$branch', '$$shopId'],
                          },
                        },
                      ],
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
                            _id: 0,
                            name: 1,
                          },
                        },
                      ],
                      as: 'brand',
                    },
                  },
                  {
                    $unwind: {
                      path: '$brand',
                      preserveNullAndEmptyArrays: true,
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
                        shop: '$brand',
                        media: '$product.media',
                        price: '$product.price',
                        quantityInStock: '$product.quantityInStock',
                        currency: '$product.currency',
                        inStock: '$inStock',
                      },
                    },
                  },
                  { $replaceRoot: { newRoot: '$product' } },
                ],
                as: 'products',
              },
            },
            { $unwind: '$products' }, // Flatten the products array
            { $replaceRoot: { newRoot: '$products' } }, // Set products as the root
          ]),
        ]);

        result = { data: pricedProducts, total: totalPriced, limit, page, pages: Math.ceil(totalPriced / limit) };

        break;
      case FavoriteTypeEnum.SHOP:
        const favShops = await this.favoriteModel.find({ favoriteType: FavoriteTypeEnum.SHOP }, { shop: 1 });

        const queryFilter = {
          branchType: BranchTypeEnum.SHOP,
          status: BranchStatusEnum.APPROVED,
          _id: { $in: favShops.map((shop) => shop.shop) },
        };

        //eslint-disable-next-line
        let [[{ totalShops = 0 } = {}], shops] = await Promise.all([
          this.favoriteModel.aggregate([...matchStage]).count('totalShops'),
          this.baseBranchModel.aggregate([
            {
              $geoNear: {
                near: { type: 'Point', coordinates: [lng, lat] },
                distanceField: 'distance',
                query: { ...queryFilter },
                distanceMultiplier: 0.001,
                maxDistance: 70 * 1000,
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

        result = {
          data: shops,
          ...(shops?.length > 0 ? { total: totalShops } : { total: 0 }),
          limit,
          page,
          pages: Math.ceil(totalShops / limit),
        };
        break;

      default:
        break;
    }

    return result;
  }
}
