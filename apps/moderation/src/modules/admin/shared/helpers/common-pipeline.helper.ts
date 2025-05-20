export enum UserFieldNameEnum {
  USER = 'user',
  AUTHOR_USER = 'authorUser',
}

export function getUserPipeline(userFieldName: UserFieldNameEnum, isPrivate = false) {
  return [
    {
      $lookup: {
        from: 'users',
        let: { userId: `$${userFieldName}` },
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
              username: 1,
              firstName: 1,
              lastName: 1,
              ...(isPrivate ? { profilePictureMedia: 1 } : {}),
            },
          },
        ],
        as: `${userFieldName}`,
      },
    },
    {
      $unwind: {
        path: `$${userFieldName}`,
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}
