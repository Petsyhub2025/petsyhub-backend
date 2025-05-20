import { PipelineStage } from 'mongoose';

export function getCitiesPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'countries',
        let: { countryId: '$country' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$countryId'] } } }, { $project: { _id: 1, name: 1 } }],
        as: 'country',
      },
    },
    { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
    {
      $project: { _id: 1, location: 1, name: 1, country: 1 },
    },
  ];
}
