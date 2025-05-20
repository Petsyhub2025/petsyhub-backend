import { PipelineStage } from 'mongoose';

export function getPetPipeline(): PipelineStage[] {
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
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'pettypes',
              let: {
                selectedPetTypeId: '$type',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$selectedPetTypeId'],
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
              as: 'type',
            },
          },
          {
            $unwind: {
              path: '$type',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              birthDateInDate: {
                $dateFromString: {
                  dateString: '$birthDate',
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              profilePictureUrl: 1,
              type: 1,
              breed: 1,
              age: {
                $dateDiff: {
                  startDate: '$birthDateInDate',
                  endDate: '$$NOW',
                  unit: 'year',
                },
              },
              birthDate: 1,
            },
          },
        ],
        as: 'selectedPet',
      },
    },
    {
      $unwind: {
        path: '$selectedPet',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}

export function getUserPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: {
          userId: '$user',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$userId'],
              },
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
            },
          },
        ],
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}

export function getBranchPipeline(): PipelineStage[] {
  return [
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
            },
          },
        ],
        as: 'branch',
      },
    },
    {
      $unwind: {
        path: '$branch',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}

export function getSelectedServicesPipeline(): PipelineStage[] {
  return [
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
  ];
}

export function getMedicalSpecialtiesPipeline(): PipelineStage[] {
  return [
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
  ];
}

export function appointmentsPipeline(): PipelineStage[] {
  return [
    ...getPetPipeline(),
    ...getUserPipeline(),
    ...getBranchPipeline(),
    ...getSelectedServicesPipeline(),
    ...getMedicalSpecialtiesPipeline(),
    {
      $project: {
        _id: 1,
        selectedPet: 1,
        user: 1,
        branch: 1,
        date: 1,
        status: 1,
        phoneNumber: 1,
        selectedServices: 1,
        medicalSpecialties: 1,
        createdAt: 1,
      },
    },
  ];
}
