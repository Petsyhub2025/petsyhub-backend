import { Inject, Injectable } from '@nestjs/common';
import { IProductCategoryModel, ModelNames, addPaginationStages, BasePaginationQuery } from '@instapets-backend/common';

@Injectable()
export class ProductCategoriesService {
  constructor(@Inject(ModelNames.PRODUCT_CATEGORY) private productCategoryModel: IProductCategoryModel) {}

  async getProductCategories(serviceProviderId: string, query: BasePaginationQuery) {
    const { page, limit } = query;
    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productCategoryModel.aggregate(matchStage).count('total'),
      this.productCategoryModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        {
          $lookup: {
            from: 'productsubcategories',
            let: { productCategoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$productCategory', '$$productCategoryId'],
                  },
                },
              },
            ],
            as: 'productSubCategories',
          },
        },
        {
          $addFields: {
            subCategoriesCount: {
              $size: '$productSubCategories',
            },
          },
        },
        {
          $project: {
            name: 1,
            iconMedia: 1,
            subCategoriesCount: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }
}
