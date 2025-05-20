import { Inject, Injectable } from '@nestjs/common';
import { IProductCategoryModel, ModelNames, addPaginationStages, BasePaginationQuery } from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class ProductCategoriesService {
  constructor(@Inject(ModelNames.PRODUCT_CATEGORY) private productCategoryModel: IProductCategoryModel) {}

  async getProductCategories(query: BasePaginationQuery, customerId?: string | Types.ObjectId) {
    const { page, limit } = query;

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productCategoryModel.aggregate().count('total'),
      this.productCategoryModel.aggregate([
        ...addPaginationStages({ page, limit }),
        {
          $project: {
            name: 1,
            iconMedia: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }
}
