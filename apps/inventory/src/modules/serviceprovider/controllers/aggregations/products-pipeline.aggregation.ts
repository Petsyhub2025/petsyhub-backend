import { PipelineStage, Types } from 'mongoose';

function supplierPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'brands',
        let: { supplierId: '$product.supplier' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$supplierId'],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'product.supplier',
      },
    },
    {
      $unwind: {
        path: '$product.supplier',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}
export function productsAggregationPipeline(supplierId?: Types.ObjectId): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'productcategories',
        let: { categoryId: '$product.category' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$categoryId'],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'product.category',
      },
    },
    {
      $unwind: {
        path: '$product.category',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'productsubcategories',
        let: { subCategoryId: '$product.subCategory' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$subCategoryId'],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'product.subCategory',
      },
    },
    {
      $unwind: {
        path: '$product.subCategory',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...supplierPipeline(),
    {
      $project: {
        product: {
          _id: '$product.productId',
          name: 1,
          category: 1,
          subCategory: 1,
          supplier: 1,
          media: 1,
          price: 1,
          quantityInStock: 1,
          totalOrders: 1,
          currency: 1,
        },
      },
    },
    { $replaceRoot: { newRoot: '$product' } },
  ];
}
