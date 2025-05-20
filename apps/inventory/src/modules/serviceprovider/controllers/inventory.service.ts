import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ModelNames,
  addPaginationStages,
  IProductModel,
  IInventoryModel,
  CustomError,
  ErrorType,
  IBaseBranchModel,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { AddProductToInventoryDto } from './dto/add-to-inventory.dto';
import { GetInventoryDto } from './dto/get-inventory.dto';
import { productsAggregationPipeline } from './aggregations/products-pipeline.aggregation';
import { UpdateProductToInventoryDto } from './dto/update-product-inventory.dto';
import { ProductIdParamDto } from '@inventory/shared/dto/product-param-id.dto';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(ModelNames.PRODUCT) private productModel: IProductModel,
    @Inject(ModelNames.INVENTORY) private inventoryModel: IInventoryModel,
    @Inject(ModelNames.BASE_BRANCH) private baseBranchModel: IBaseBranchModel,
  ) {}

  async addProductToInventory(
    serviceProviderId: string | Types.ObjectId,
    { price, productId, quantity, branchId, brandId }: AddProductToInventoryDto,
  ) {
    const product = await this.productModel.findById(productId);
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
    if (await this.inventoryModel.exists({ branch: new Types.ObjectId(branchId), 'product.productId': productId })) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            en: 'Product is already in stock',
            ar: 'المنتج موجود بالفعل في المخزن',
          },
          errorType: ErrorType.CONFLICT,
          event: 'PRODUCT_ALREADY_IN_STOCK',
        }),
      );
    }

    // Get branch country
    const [branch] = await this.baseBranchModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(branchId) },
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
                countryCurrency: 1,
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
        $project: {
          name: 1,
          country: 1,
        },
      },
    ]);
    if (!branch)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Branch not found',
            ar: 'الفرع غير موجود',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'BRANCH_NOT_FOUND',
        }),
      );

    const addedProductToInventory = new this.inventoryModel({
      branch: new Types.ObjectId(branchId),
      brand: new Types.ObjectId(brandId),
      product: {
        supplier: product.supplier,
        category: product.category,
        description: product.description,
        media: product.media,
        name: product.name,
        petTypes: product.petTypes,
        price,
        quantityInStock: quantity,
        productId: product._id,
        subCategory: product.subCategory,
        currency: 'AED',
        // currency: branch.country?.countryCurrency || 'AED',
        //TODO UNDO THIS LAST CHANGE ABOVE (CURRRENCY IS TEMPORARILY FORCED TO BE AED FOR DEMO PURPOSES)
      },
    });

    await addedProductToInventory.save();
  }

  async getInventory(serviceProviderId: string, query: GetInventoryDto) {
    const { page, limit, supplierId, categories, subCategories, branchId } = query;
    if (!branchId) {
      return { data: [], total: 0, limit, page, pages: 0 };
    }
    const matchStage = [
      {
        $match: {
          branch: new Types.ObjectId(branchId),
          ...(supplierId && { 'product.supplier': new Types.ObjectId(supplierId) }),
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
        ...productsAggregationPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async editProductToInventory(
    serviceProviderId: string | Types.ObjectId,
    { price, quantity, branchId, brandId }: UpdateProductToInventoryDto,
    { productId }: ProductIdParamDto,
  ) {
    const product = await this.productModel.findById(productId);
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

    const addedProductToInventory = await this.inventoryModel.findOne({
      branch: new Types.ObjectId(branchId),
      'product.productId': new Types.ObjectId(productId),
    });
    if (!addedProductToInventory) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            en: 'Product is not in stock',
            ar: 'المنتج غير موجود في المخزن',
          },
          errorType: ErrorType.CONFLICT,
          event: 'PRODUCT_NOT_IN_STOCK',
        }),
      );
    }

    // Get branch country
    const [branch] = await this.baseBranchModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(branchId) },
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
                countryCurrency: 1,
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
        $project: {
          name: 1,
          country: 1,
        },
      },
    ]);
    if (!branch)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Branch not found',
            ar: 'الفرع غير موجود',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'BRANCH_NOT_FOUND',
        }),
      );

    addedProductToInventory.set({
      branch: new Types.ObjectId(branchId),
      brand: new Types.ObjectId(brandId),
      product: {
        supplier: product.supplier,
        category: product.category,
        description: product.description,
        media: product.media,
        name: product.name,
        petTypes: product.petTypes,
        price,
        quantityInStock: quantity,
        productId: product._id,
        subCategory: product.subCategory,
        currency: 'AED',
        // currency: branch.country?.countryCurrency || 'AED',
        //TODO UNDO THIS LAST CHANGE ABOVE (CURRRENCY IS TEMPORARILY FORCED TO BE AED FOR DEMO PURPOSES)
      },
    });
    await addedProductToInventory.save();
  }
}
