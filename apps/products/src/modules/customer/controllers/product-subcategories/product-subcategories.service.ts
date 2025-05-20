import { Inject, Injectable } from '@nestjs/common';
import { IProductSubCategoryModel, ModelNames, addPaginationStages } from '@instapets-backend/common';
import { Types } from 'mongoose';
import { GetSubCategoriesQueryDto } from './dto/get-subcategories.dto';

@Injectable()
export class ProductSubCategoriesService {
  constructor(@Inject(ModelNames.PRODUCT_SUBCATEGORY) private productSubCategoryModel: IProductSubCategoryModel) {}

  async getProductSubCategories(query: GetSubCategoriesQueryDto, customerId?: string | Types.ObjectId) {
    const { page, limit, productCategory } = query;

    const matchStage = [
      {
        $match: {
          ...(productCategory && { productCategory: new Types.ObjectId(productCategory) }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productSubCategoryModel.aggregate([...matchStage]).count('total'),
      this.productSubCategoryModel.aggregate([
        ...matchStage,
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
