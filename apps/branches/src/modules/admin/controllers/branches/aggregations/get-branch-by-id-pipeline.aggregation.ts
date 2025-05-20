import { PipelineStage, Types } from 'mongoose';

export function GetBranchByIdPipeline(branchId: string): PipelineStage[] {
  return [
    {
      $match: {
        _id: new Types.ObjectId(branchId),
      },
    },
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
                      $eq: ['$brand', { $ifNull: ['$$brandId', null] }],
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
                            $eq: ['$_id', { $ifNull: ['$$serviceProviderId', null] }],
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
      $lookup: {
        from: 'cities',
        localField: 'city',
        foreignField: '_id',
        as: 'cityDoc',
      },
    },
    {
      $unwind: {
        path: '$cityDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'countries',
        localField: 'country',
        foreignField: '_id',
        as: 'countryDoc',
      },
    },
    {
      $unwind: {
        path: '$countryDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'areas',
        localField: 'area',
        foreignField: '_id',
        as: 'areaDoc',
      },
    },
    {
      $unwind: {
        path: '$areaDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: 1,
        branchType: 1,
        phoneNumber: 1,
        additionalPhoneNumber: 1,
        status: 1,
        email: 1,
        streetAddress: 1,
        location: 1,
        documents: 1,
        schedule: 1,
        rejectedAt: 1,
        approvedAt: 1,
        rating: 1,
        totalRatings: 1,
        deletedAt: 1,
        suspendedAt: 1,
        suspendedDueToUserSuspensionAt: 1,
        isViewable: 1,
        estimatedArrivalTime: 1,
        isSelfShipping: 1,
        shippingFee: 1,
        shippingType: 1,
        createdAt: 1,
        updatedAt: 1,
        brandName: '$brand.name',
        brandOwnerName: '$brand.brandOwnerMembership.serviceProvider.fullName',
        cityName: '$cityDoc.name',
        countryName: '$countryDoc.name',
        areaName: '$areaDoc.name',
      },
    },
  ];
}
