import { PipelineStage } from 'mongoose';

function petTypesPipeline(): PipelineStage[] {
  return [
    {
      $unwind: {
        path: '$petTypes',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'pettypes',
        let: { petTypeId: '$petTypes' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$petTypeId'],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'petTypes',
      },
    },
    {
      $unwind: {
        path: '$petTypes',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        petTypes: {
          $push: '$petTypes',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { petTypes: '$petTypes' }],
        },
      },
    },
  ];
}

export function productDetailsAggregationPipeline(): PipelineStage[] {
  return [
    ...petTypesPipeline(),
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

    {
      $project: {
        name: 1,
        sku: 1,
        category: 1,
        subCategory: 1,
        supplier: 1,
        petTypes: 1,
        media: 1,
        description: 1,
      },
    },
  ];
}
