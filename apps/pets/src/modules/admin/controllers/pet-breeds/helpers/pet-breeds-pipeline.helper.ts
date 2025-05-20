import { PipelineStage } from 'mongoose';

export function getBreedsPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'pettypes',
        let: { typeId: '$type' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$typeId'],
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
        as: 'type',
      },
    },
    { $unwind: { path: '$type', preserveNullAndEmptyArrays: true } },
    {
      $project: { _id: 1, type: 1, name: 1 },
    },
  ];
}
