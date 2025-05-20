import { Types } from 'mongoose';
import { LikeType } from '../base-like';

/**
 * Adds isLiked field to aggregation based on type
 * @param  userId
 * @param  type
 * @returns Array
 */
export function getIsLiked(userId: string, type: LikeType): any[] {
  return [
    {
      $lookup: {
        from: 'baselikes',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: [`$${type}`, '$$id'] }, { $eq: ['$authorUser', new Types.ObjectId(userId)] }],
              },
            },
          },
        ],
        as: 'like',
      },
    },
    {
      $addFields: {
        isLiked: {
          $cond: {
            if: { $gt: [{ $size: '$like' }, 0] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $unset: 'like',
    },
  ];
}
