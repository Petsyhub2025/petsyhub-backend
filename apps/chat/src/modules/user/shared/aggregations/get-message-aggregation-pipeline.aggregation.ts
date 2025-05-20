import { PipelineStage, Types } from 'mongoose';

export function getMessageAggregationPipeline(userId: string | Types.ObjectId): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: {
          senderId: '$sender',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$senderId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              firstName: 1,
              lastName: 1,
              profilePictureMedia: 1,
            },
          },
        ],
        as: 'sender',
      },
    },
    {
      $unwind: {
        path: '$sender',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'userchatroomrelations',
        let: {
          messageCreatedAt: '$createdAt',
          messageId: '$_id',
          roomId: '$room',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$room', { $ifNull: ['$$roomId', null] }],
                  },
                  {
                    $gte: ['$lastMessageSeenDate', { $ifNull: ['$$messageCreatedAt', null] }],
                  },
                  {
                    $ne: ['$user', new Types.ObjectId(userId)],
                  },
                ],
              },
            },
          },
          {
            $sort: {
              lastMessageSeenDate: -1,
              _id: -1,
            },
          },
          {
            $limit: 10,
          },
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
                    profilePictureMedia: 1,
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
          {
            $addFields: {
              // This boolean serves as a way for clients to tell, out of all messages each user saw in a room (due to their lastMessageSeenDate being above its createdAt)
              // which one exactly was the last message they saw for the blip/avatar of the user to show on it.
              isLastMessageRead: {
                $cond: {
                  if: {
                    $eq: ['$lastMessageSeenId', '$$messageId'],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              user: 1,
              isLastMessageRead: 1,
              createdAt: 1,
            },
          },
        ],
        as: 'userMessageStatus',
      },
    },
    {
      $project: {
        _id: 1,
        sender: 1,
        body: 1,
        media: 1,
        isDeleted: 1,
        isSent: 1,
        userMessageStatus: 1,
        createdAt: 1,
      },
    },
  ];
}
