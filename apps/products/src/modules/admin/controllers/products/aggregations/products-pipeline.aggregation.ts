import { PipelineStage, Types } from 'mongoose';

function supplierPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'brands',
        let: { supplierId: '$supplier' },
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
              logoPictureMedia: 1,
            },
          },
        ],
        as: 'supplier',
      },
    },
    {
      $unwind: {
        path: '$supplier',
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
        let: { categoryId: '$category' },
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
              iconMedia: 1,
            },
          },
        ],
        as: 'category',
      },
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'productsubcategories',
        let: { subCategoryId: '$subCategory' },
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
              iconMedia: 1,
            },
          },
        ],
        as: 'subCategory',
      },
    },
    {
      $unwind: {
        path: '$subCategory',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...(supplierId
      ? {
          ...supplierPipeline(),
          ...[
            {
              $project: {
                name: 1,
                category: 1,
                subCategory: 1,
                supplier: 1,
              },
            },
          ],
        }
      : [
          {
            $project: {
              name: 1,
              category: 1,
              subCategory: 1,
            },
          },
        ]),
  ];
}
