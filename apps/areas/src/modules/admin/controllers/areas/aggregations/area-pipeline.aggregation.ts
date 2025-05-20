import { PipelineStage } from 'mongoose';

export function getAreaPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'cities',
        let: { cityId: '$city' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$cityId'] } } }, { $project: { _id: 1, name: 1 } }],
        as: 'city',
      },
    },
    { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        location: {
          lng: { $arrayElemAt: ['$location.coordinates', 0] },
          lat: { $arrayElemAt: ['$location.coordinates', 1] },
        },
      },
    },
    {
      $project: { _id: 1, location: 1, name: 1, area: 1 },
    },
  ];
}
