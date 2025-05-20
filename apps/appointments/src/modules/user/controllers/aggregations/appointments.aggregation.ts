export function appointmentPipeline() {
  return [
    {
      $lookup: {
        from: 'pets',
        let: {
          selectedPetId: '$selectedPet',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$selectedPetId'],
              },
            },
          },
          {
            $lookup: {
              from: 'petbreeds',
              let: {
                selectedPetBreedId: '$breed',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$selectedPetBreedId'],
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
              as: 'breed',
            },
          },
          {
            $unwind: {
              path: '$breed',
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              profilePictureUrl: 1,
              breed: 1,
            },
          },
        ],
        as: 'selectedPet',
      },
    },
    {
      $unwind: {
        path: '$selectedPet',
      },
    },
    {
      $unwind: {
        path: '$selectedServices',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'branchservicetypes',
        let: { selectedServiceId: '$selectedServices' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$selectedServiceId'],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'selectedServices',
      },
    },
    {
      $unwind: {
        path: '$selectedServices',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        selectedServices: {
          $push: '$selectedServices',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { selectedServices: '$selectedServices' }],
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
          $mergeObjects: ['$root', { medicalSpecialties: '$medicalSpecialties' }],
        },
      },
    },
    {
      $lookup: {
        from: 'basebranches',
        let: {
          branchId: '$branch',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$branchId'],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              brand: 1,
            },
          },
          {
            $lookup: {
              from: 'brands',
              let: {
                brandId: '$brand',
              },
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
                    _id: 1,
                    name: 1,
                    coverPictureMedia: 1,
                    logoPictureMedia: 1,
                  },
                },
              ],
              as: 'brand',
            },
          },
          {
            $unwind: {
              path: '$brand',
            },
          },
        ],
        as: 'branch',
      },
    },
    {
      $unwind: {
        path: '$branch',
      },
    },
    {
      $project: {
        _id: 1,
        selectedPet: 1,
        date: 1,
        petHealthDescription: 1,
        status: 1,
        branch: 1,
        selectedServices: 1,
        medicalSpecialties: 1,
      },
    },
  ];
}
