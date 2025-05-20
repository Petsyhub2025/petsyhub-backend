import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ModelNames, addPaginationStages, IProductModel, CustomError, ErrorType } from '@instapets-backend/common';
import { Types } from 'mongoose';
import { ProductIdParamDto } from '@products/shared/dto/product-param-id.dto';
import { productsAggregationPipeline } from './aggregations/products-pipeline.aggregation';
import { productDetailsAggregationPipeline } from './aggregations/product-details-pipeline.aggregation';
import { GetProductsDto } from './dto/get-products.dto';
import { BranchIdQueryDto } from '@products/shared/dto/branch-id-query.dto';

@Injectable()
export class ProductsService {
  constructor(@Inject(ModelNames.PRODUCT) private productModel: IProductModel) {}

  async getProducts(serviceProviderId: string, query: GetProductsDto) {
    const { page, limit, categories, subCategories, supplierId, branchId } = query;
    const matchStage = [
      {
        $match: {
          ...(supplierId && { supplier: new Types.ObjectId(supplierId) }),
          ...(categories?.length && { category: { $in: categories.map((category) => new Types.ObjectId(category)) } }),
          ...(subCategories?.length && {
            subCategory: { $in: subCategories.map((subCategory) => new Types.ObjectId(subCategory)) },
          }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productModel.aggregate(matchStage).count('total'),
      this.productModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...productsAggregationPipeline(branchId, supplierId),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getProductById(serviceProviderId: string, { productId }: ProductIdParamDto, { branchId }: BranchIdQueryDto) {
    const [product] = await this.productModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(productId),
        },
      },
      ...productDetailsAggregationPipeline(branchId),
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
}
