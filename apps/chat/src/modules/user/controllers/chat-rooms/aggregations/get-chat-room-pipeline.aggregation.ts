import { ChatRoomType, UserSocketStatusEnum } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';

export function getLastMessageAggregationPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'chatmessages',
        let: {
          roomId: '$room',
          messageFilterStartDate: '$messageFilterStartDate',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$room', '$$roomId'] },
                  {
                    $gt: ['$createdAt', '$$messageFilterStartDate'],
                  },
                ],
              },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 1,
          },
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
                      $eq: ['$_id', '$$senderId'],
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
            $project: {
              _id: 1,
              sender: 1,
              body: 1,
              isMediaMessage: {
                $cond: {
                  if: { $gt: [{ $size: { $ifNull: ['$media', []] } }, 0] },
                  then: true,
                  else: false,
                },
              },
              mediaType: {
                $cond: {
                  if: { $gt: [{ $size: { $ifNull: ['$media', []] } }, 0] },
                  then: {
                    $arrayElemAt: ['$media.type', 0],
                  },
                  else: '$$REMOVE',
                },
              },
              isDeleted: 1,
              createdAt: 1,
            },
          },
        ],
        as: 'lastMessage',
      },
    },
    {
      $unwind: {
        path: '$lastMessage',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $sort: {
        'lastMessage.createdAt': -1,
        'lastMessage._id': -1,
      },
    },
  ];
}

export function getChatRoomAggregationPipeline(userId: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'basechatrooms',
        let: {
          roomId: '$room',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$roomId'],
              },
            },
          },
          // Process private chat room details
          {
            $addFields: {
              participants: {
                $filter: {
                  input: { $ifNull: ['$participants', []] },
                  as: 'participant',
                  cond: {
                    $ne: ['$$participant', new Types.ObjectId(userId)],
                  },
                },
              },
            },
          },
          {
            $unwind: {
              path: '$participants',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              let: {
                participantId: { $ifNull: ['$participants', null] },
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$participantId'],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    profilePictureMedia: 1,
                    socketStatus: 1,
                    lastSocketActiveDate: 1,
                  },
                },
              ],
              as: 'participant',
            },
          },
          {
            $unwind: {
              path: '$participant',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unset: ['participants'],
          },
          {
            $addFields: {
              name: {
                $ifNull: [
                  '$name',
                  {
                    $cond: [
                      { $gt: ['$participant', null] },
                      { $concat: ['$participant.firstName', ' ', '$participant.lastName'] },
                      'Petsy User',
                    ],
                  },
                ],
              },
              roomPictureMedia: { $ifNull: ['$roomPictureMedia', '$participant.profilePictureMedia'] },
              isUserActive: {
                $cond: [
                  {
                    $eq: [
                      { $ifNull: ['$participant.socketStatus', UserSocketStatusEnum.OFFLINE] },
                      UserSocketStatusEnum.ONLINE,
                    ],
                  },
                  true,
                  false,
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              roomPictureMedia: 1,
              chatRoomType: 1,
              isUserActive: {
                $cond: {
                  if: { $eq: ['$chatRoomType', ChatRoomType.PRIVATE] },
                  then: '$isUserActive',
                  else: '$$REMOVE',
                },
              },
            },
          },
        ],
        as: 'room',
      },
    },
    {
      $unwind: {
        path: '$room',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$room',
            {
              lastMessage: '$lastMessage',
            },
          ],
        },
      },
    },
  ];
}
