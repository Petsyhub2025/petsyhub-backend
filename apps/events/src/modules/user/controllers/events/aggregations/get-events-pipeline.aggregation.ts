import { getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

export function getEventsAggregationPipeline(viewerId: string): PipelineStage[] {
  return [
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
          ...getIsUserFollowed(viewerId),
          {
            $project: {
              _id: 1,
              username: 1,
              profilePictureMedia: 1,
              firstName: 1,
              lastName: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
            },
          },
        ],
        as: 'authorUser',
      },
    },
    {
      $unwind: {
        path: '$authorUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'eventcategories',
        let: { categoryId: '$category' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$categoryId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
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
      $project: {
        authorUser: 1,
        title: 1,
        type: 1,
        media: 1,
        capacity: 1,
        startDate: 1,
        endDate: 1,
        category: 1,
        createdAt: 1,
        dynamicLink: 1,
        eventAddress: '$placeLocation.locationData.address',
      },
    },
  ];
}
