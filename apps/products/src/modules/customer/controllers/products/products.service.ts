import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ModelNames,
  addPaginationStages,
  IProductModel,
  CustomError,
  ErrorType,
  IInventoryModel,
  BranchTypeEnum,
  BranchStatusEnum,
  IBaseBranchModel,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { ProductIdParamDto } from '@products/shared/dto/product-param-id.dto';
import { DiscoverAllProductsDto } from './dto/discover-products.dto';
import { AvailableShopsForProductDto } from './dto/available-shops-list.dto';
import { GetAllProductsDto } from './dto/get-products.dto';
import { SortingByPriceEnum } from '@products/customer/shared/enums/sorting-keys.enum';
import { GetPricedProductDetailsDto } from './dto/get-priced-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(ModelNames.PRODUCT) private productModel: IProductModel,
    @Inject(ModelNames.INVENTORY) private inventoryModel: IInventoryModel,
    @Inject(ModelNames.BASE_BRANCH)
    private readonly baseBranchModel: IBaseBranchModel,
  ) {}

  async discoverAllProducts(query: DiscoverAllProductsDto, customerId?: string | Types.ObjectId) {
    const { page, limit, categories, subCategories } = query;

    const matchStage = [
      {
        $match: {
          ...(categories?.length && { category: { $in: categories.map((category) => new Types.ObjectId(category)) } }),
          ...(subCategories?.length && {
            subCategory: { $in: subCategories.map((subCategory) => new Types.ObjectId(subCategory)) },
          }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productModel
        .aggregate([
          ...matchStage,
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
        ])
        .count('total'),
      this.productModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
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
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async discoverProductById({ productId }: ProductIdParamDto, customerId?: string | Types.ObjectId) {
    const [product] = await this.productModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(productId),
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
      { $project: { name: 1, media: 1, description: 1 } },
    ]);
    if (!product) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Product not found',
            ar: 'لم يتم العثور على للمنتج',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'PRODUCT_NOT_FOUND',
        }),
      );
    }

    return product;
  }

  async getPricedProductDetailsById(
    { productId }: ProductIdParamDto,
    { shopId }: GetPricedProductDetailsDto,
    customerId?: string | Types.ObjectId,
  ) {
    const matchStage = [
      {
        $match: {
          'product.productId': new Types.ObjectId(productId),
          ...(shopId && { branch: new Types.ObjectId(shopId) }),
        },
      },
    ];

    //TODO: Lookup with favorites model for specific customer and check delivery type for brand
    const [product] = await this.inventoryModel.aggregate([
      ...matchStage,
      {
        $lookup: {
          from: 'basebranches',
          let: { branchId: '$branch' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$branchId'],
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
                rating: 1,
                totalRatings: 1,
                streetAddress: 1,
                logoPictureMedia: '$brand.logoPictureMedia',
                name: '$brand.name',
              },
            },
          ],
          as: 'shop',
        },
      },
      {
        $unwind: {
          path: '$shop',
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
            description: '$product.description',
            media: '$product.media',
            price: '$product.price',
            quantityInStock: '$product.quantityInStock',
            currency: '$product.currency',
            inStock: '$inStock',
            shop: '$shop',
          },
        },
      },
      { $replaceRoot: { newRoot: '$product' } },
    ]);

    if (!product) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Product not found',
            ar: 'لم يتم العثور على للمنتج',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'PRODUCT_NOT_FOUND',
        }),
      );
    }

    return product;
  }

  async getAvailableShopsForProduct(
    { productId }: ProductIdParamDto,
    query: AvailableShopsForProductDto,
    customerId?: string | Types.ObjectId,
  ) {
    const { page, limit, sortByPrice = SortingByPriceEnum.LOW, lat, lng } = query;

    const queryFilter = {
      branchType: BranchTypeEnum.SHOP,
      status: BranchStatusEnum.APPROVED,
    };

    const branches = await this.baseBranchModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          query: { ...queryFilter },
          distanceMultiplier: 0.001,
          maxDistance: 70 * 1000,
        },
      },
      {
        $lookup: {
          from: 'inventories',
          let: { branchId: '$_id' },
          pipeline: [
            {
              $match: {
                'product.productId': new Types.ObjectId(productId),
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
        $project: {
          _id: 1,
        },
      },
    ]);

    const sortingMapping: { [key: string]: number } = {
      low: 1,
      high: -1,
    };

    const matchStage = [
      {
        $match: {
          'product.productId': new Types.ObjectId(productId),
          branch: { $in: branches.map((branch) => new Types.ObjectId(branch._id)) },
        },
      },
    ];

    //TODO: Lookup with favorites model for specific customer and check delivery type for brand
    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.inventoryModel.aggregate(matchStage).count('total'),
      this.inventoryModel.aggregate([
        ...matchStage,
        {
          $sort: {
            'product.price': sortingMapping[sortByPrice],
          } as Record<string, any>,
        },
        ...addPaginationStages({ page, limit }),
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
            _id: '$branch',
            name: '$brand.name',
            logoPictureMedia: '$brand.logoPictureMedia',
            price: '$product.price',
            quantityInStock: '$product.quantityInStock',
            currency: '$product.currency',
            inStock: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getShopPricedProducts(query: GetAllProductsDto, customerId?: string | Types.ObjectId) {
    const { page, limit, categories, subCategories, shopId } = query;

    const matchStage = [
      {
        $match: {
          branch: new Types.ObjectId(shopId),
          ...(categories?.length && {
            'product.category': { $in: categories.map((category) => new Types.ObjectId(category)) },
          }),
          ...(subCategories?.length && {
            'product.subCategory': { $in: subCategories.map((subCategory) => new Types.ObjectId(subCategory)) },
          }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.inventoryModel.aggregate(matchStage).count('total'),
      this.inventoryModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
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
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }
}
