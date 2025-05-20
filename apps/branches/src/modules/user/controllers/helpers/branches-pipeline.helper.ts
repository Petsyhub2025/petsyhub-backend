export function brandPopulationPipeline(): any[] {
  return [
    {
      $lookup: {
        from: 'brands',
        let: { brandId: '$brand' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$brandId'],
              },
            },
          },
          {
            $project: {
              logoPictureMedia: 1,
              coverPictureMedia: 1,
              name: 1,
              bio: 1,
            },
          },
        ],
        as: 'brand',
      },
    },
    {
      $unwind: {
        path: '$brand',
        preserveNullAndEmptyArrays: false,
      },
    },
  ];
}

function countryPipeline(): any[] {
  return [
    {
      $lookup: {
        from: 'countries',
        let: { countryId: '$country' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$countryId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'country',
      },
    },
    { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
  ];
}

function cityPipeline(): any[] {
  return [
    {
      $lookup: {
        from: 'cities',
        let: { cityId: '$city' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$cityId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'city',
      },
    },
    { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
  ];
}
function areaPipeline(): any[] {
  return [
    {
      $lookup: {
        from: 'areas',
        let: { areaId: '$area' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$areaId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'area',
      },
    },
    { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
  ];
}

export function branchesPopulationPipeline(isListView = false): any[] {
  return [
    ...brandPopulationPipeline(),
    ...(isListView
      ? []
      : [
          ...cityPipeline(),
          ...countryPipeline(),
          ...areaPipeline(),
          {
            $unwind: {
              path: '$serviceTypes',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'branchservicetypes',
              let: { serviceTypeId: '$serviceTypes' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$serviceTypeId'],
                    },
                  },
                },
                {
                  $project: {
                    name: 1,
                  },
                },
              ],
              as: 'serviceTypes',
            },
          },
          {
            $unwind: {
              path: '$serviceTypes',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$_id',
              root: {
                $first: '$$ROOT',
              },
              serviceTypes: {
                $push: '$serviceTypes',
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  '$root',
                  {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $size: '$serviceTypes',
                          },
                          0,
                        ],
                      }, // Check if array is non-empty
                      then: {
                        serviceTypes: '$serviceTypes',
                      },
                      else: {}, // Don't add the field if empty
                    },
                  },
                ],
              },
            },
          },
          {
            $unwind: {
              path: '$medicalSpecialties',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'medicalspecialties',
              let: { medicalSpecialtyId: '$medicalSpecialties' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$medicalSpecialtyId'],
                    },
                  },
                },
                {
                  $project: {
                    name: 1,
                  },
                },
              ],
              as: 'medicalSpecialties',
            },
          },
          {
            $unwind: {
              path: '$medicalSpecialties',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$_id',
              root: {
                $first: '$$ROOT',
              },
              medicalSpecialties: {
                $push: '$medicalSpecialties',
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  '$root',
                  {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $size: '$medicalSpecialties',
                          },
                          0,
                        ],
                      },
                      then: {
                        medicalSpecialties: '$medicalSpecialties',
                      },
                      else: {},
                    },
                  },
                ],
              },
            },
          },
        ]),
    ...(isListView
      ? [
          {
            $addFields: {
              distance: { $cond: ['$dist', { $round: ['$dist.calculated', 2] }, 0] },
            },
          },
          {
            $project: {
              name: 1,
              brand: 1,
              distance: 1,
            },
          },
        ]
      : [
          {
            $project: {
              name: 1,
              brand: 1,
              location: 1,
              schedule: 1,
              serviceTypes: 1,
              medicalSpecialties: 1,
              streetAddress: 1,
              postalCode: 1,
              city: 1,
              country: 1,
              area: 1,
              status: 1,
              phoneNumber: 1,
            },
          },
        ]),
  ];
}
