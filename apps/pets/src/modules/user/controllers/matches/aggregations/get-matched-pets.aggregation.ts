import { MediaTypeEnum } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

export function getMatchedPetsAggregationPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'petbreeds',
        let: { breedId: '$breed' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$breedId', null] }],
              },
            },
          },
          {
            $project: {
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
        let: { typeId: '$type' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$typeId', null] }],
              },
            },
          },
          {
            $project: {
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
      $lookup: {
        from: 'posts',
        let: { petId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$authorPet', { $ifNull: ['$$petId', null] }] }, { $eq: ['$isViewable', true] }],
              },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 3,
          },
          {
            $addFields: {
              media: {
                $filter: {
                  input: '$media',
                  as: 'media',
                  cond: {
                    $eq: ['$$media.type', MediaTypeEnum.IMAGE],
                  },
                },
              },
            },
          },
          {
            $unwind: {
              path: '$media',
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [{ url: '$media.url' }],
              },
            },
          },
        ],
        as: 'images',
      },
    },
    {
      $addFields: {
        images: {
          $concatArrays: [{ $cond: ['$profilePictureMedia', [{ url: '$profilePictureMedia.url' }], []] }, '$images'],
        },
      },
    },
    {
      $project: {
        _id: '$privateId',
        bio: 1,
        gender: 1,
        height: 1,
        name: 1,
        type: 1,
        breed: 1,
        weight: 1,
        isLost: 1,
        status: 1,
        images: 1,
        birthDate: 1,
      },
    },
  ];
}
