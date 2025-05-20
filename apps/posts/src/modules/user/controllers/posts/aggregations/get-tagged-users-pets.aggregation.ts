import { getIsPetFollowed, getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';

export function getTaggedUsersAndPetsPipeline(viewerId: string, mergeLists = false): PipelineStage[] {
  return [
    {
      $unwind: {
        path: '$taggedUsers',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$taggedUsers' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$userId'],
              },
            },
          },
          ...getIsUserFollowed(viewerId),
          {
            $project: {
              firstName: 1,
              lastName: 1,
              username: 1,
              profilePictureMedia: 1,
              isPrivate: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
              ...(mergeLists && {
                type: 'user',
              }),
            },
          },
        ],
        as: 'taggedUsers',
      },
    },
    {
      $unwind: {
        path: '$taggedUsers',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        taggedUsers: {
          $push: '$taggedUsers',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { taggedUsers: '$taggedUsers' }],
        },
      },
    },
    {
      $unwind: {
        path: '$taggedPets',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'pets',
        let: { petId: '$taggedPets' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$petId', null] }],
              },
            },
          },
          ...getIsPetFollowed(viewerId),
          // {
          //   $lookup: {
          //     from: 'users',
          //     let: { userId: '$user.userId' },
          //     pipeline: [
          //       {
          //         $match: {
          //           $expr: {
          //             $eq: ['$_id', '$$userId'],
          //           },
          //         },
          //       },
          //       {
          //         $project: {
          //           firstName: 1,
          //           lastName: 1,
          //           username: 1,
          //           profilePictureMedia: 1,
          //         },
          //       },
          //     ],
          //     as: 'user',
          //   },
          // },
          // {
          //   $unwind: {
          //     path: '$user',
          //     preserveNullAndEmptyArrays: true,
          //   },
          // },
          {
            $project: {
              name: 1,
              profilePictureMedia: 1,
              isPrivate: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isPetOwnedByMe: {
                $cond: {
                  if: {
                    $eq: ['$user.userId', new Types.ObjectId(viewerId)],
                  },
                  then: true,
                  else: false,
                },
              },
              ...(mergeLists && {
                type: 'pet',
              }),
            },
          },
        ],
        as: 'taggedPets',
      },
    },
    {
      $unwind: {
        path: '$taggedPets',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        taggedPets: {
          $push: '$taggedPets',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { taggedPets: '$taggedPets' }],
        },
      },
    },
    ...(mergeLists
      ? [
          {
            $addFields: {
              taggedPetsAndUsers: {
                $concatArrays: ['$taggedUsers', '$taggedPets'],
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  {
                    taggedPetsAndUsers: {
                      $ifNull: ['$taggedPetsAndUsers', []],
                    },
                  },
                ],
              },
            },
          },
        ]
      : []),
  ];
}
