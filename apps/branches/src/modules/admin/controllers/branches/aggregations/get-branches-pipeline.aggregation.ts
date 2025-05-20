import { PipelineStage } from 'mongoose';

export function GetBranchesPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'brands',
        let: { brandId: '$brand' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$brandId', null] }],
              },
            },
          },
          {
            $lookup: {
              from: 'brandmemberships',
              let: { brandId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        '$brand',
                        {
                          $ifNull: ['$$brandId', null],
                        },
                      ],
                    },
                    isBrandOwner: true,
                  },
                },
                {
                  $lookup: {
                    from: 'serviceproviders',
                    let: {
                      serviceProviderId: '$serviceProvider',
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $eq: [
                              '$_id',
                              {
                                $ifNull: ['$$serviceProviderId', null],
                              },
                            ],
                          },
                        },
                      },
                      {
                        $project: {
                          fullName: 1,
                        },
                      },
                    ],
                    as: 'serviceProvider',
                  },
                },
                {
                  $unwind: {
                    path: '$serviceProvider',
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $project: {
                    serviceProvider: 1,
                  },
                },
              ],
              as: 'brandOwnerMembership',
            },
          },
          {
            $unwind: {
              path: '$brandOwnerMembership',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              brandOwnerMembership: 1,
            },
          },
        ],
        as: 'brand',
      },
    },
    {
      $unwind: {
        path: '$brand',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: 1,
        branchType: 1,
        phoneNumber: 1,
        status: 1,
        email: 1,
        brandName: '$brand.name',
        brandOwnerName: '$brand.brandOwnerMembership.serviceProvider.fullName',
      },
    },
  ];
}
