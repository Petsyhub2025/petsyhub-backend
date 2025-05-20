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

function inventoryPipeline(branchId: string | Types.ObjectId) {
  return [
    {
      $lookup: {
        from: 'inventories',
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$product.productId', '$$productId'],
                  },
                  {
                    $eq: ['$branch', new Types.ObjectId(branchId)],
                  },
                ],
              },
            },
          },
        ],
        as: 'productInventory',
      },
    },
    {
      $unwind: {
        path: '$productInventory',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        isAddedToInventory: {
          $cond: {
            if: {
              $gt: ['$productInventory', null],
            },

            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        name: 1,
        category: 1,
        subCategory: 1,
        supplier: 1,
        description: 1,
        media: 1,
        isAddedToInventory: 1,
        price: '$productInventory.product.price',
        quantityInStock: '$productInventory.product.quantityInStock',
        totalOrders: '$productInventory.product.totalOrders',
      },
    },
  ];
}
export function productsAggregationPipeline(
  branchId?: string | Types.ObjectId,
  supplierId?: Types.ObjectId,
): PipelineStage[] {
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
    ...supplierPipeline(),
    ...(branchId
      ? inventoryPipeline(branchId)
      : [
          {
            $addFields: {
              isAddedToInventory: false,
            },
          },
          {
            $project: {
              name: 1,
              category: 1,
              subCategory: 1,
              supplier: 1,
              description: 1,
              media: 1,
              isAddedToInventory: 1,
            },
          },
        ]),
  ];
}
