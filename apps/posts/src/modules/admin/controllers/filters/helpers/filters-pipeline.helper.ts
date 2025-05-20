export function getPostsFilterPipeline() {
  return [
    //user lookup with let
    {
      $lookup: {
        from: 'users',
        let: { userId: '$authorUser' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$userId', null] }],
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
        as: 'authorUser',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
    //do the same for pet
    {
      $lookup: {
        from: 'pets',
        let: { petId: '$authorPet' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$petId', null] }],
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
        as: 'authorPet',
      },
    },
    {
      $unwind: {
        path: '$authorPet',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 1,
        authorUser: 1,
        authorPet: 1,
      },
    },
  ];
}
