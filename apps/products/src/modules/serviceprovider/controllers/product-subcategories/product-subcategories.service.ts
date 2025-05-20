import { Inject, Injectable } from '@nestjs/common';
import { IProductSubCategoryModel, ModelNames, addPaginationStages } from '@instapets-backend/common';
import { Types } from 'mongoose';
import { GetSubCategoriesQueryDto } from './dto/get-subcategories.dto';

@Injectable()
export class ProductSubCategoriesService {
  constructor(@Inject(ModelNames.PRODUCT_SUBCATEGORY) private productSubCategoryModel: IProductSubCategoryModel) {}

  async getProductSubCategories(serviceProviderId: string, query: GetSubCategoriesQueryDto) {
    const { page, limit, productCategory } = query;
    const matchStage = [
      {
        $match: {
          ...(productCategory && { productCategory: new Types.ObjectId(productCategory) }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productSubCategoryModel.aggregate(matchStage).count('total'),
      this.productSubCategoryModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        {
          $lookup: {
            from: 'productcategories',
            let: { productCategoryId: '$productCategory' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$productCategoryId'],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'productCategory',
          },
        },
        {
          $unwind: {
            path: '$productCategory',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'products',
            let: { subCategoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$subCategory', '$$subCategoryId'],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'products',
          },
        },
        {
          $addFields: {
            totalProducts: { $size: '$products' },
          },
        },
        {
          $project: {
            productCategory: 1,
            totalProducts: 1,
            name: 1,
            iconMedia: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }
}
