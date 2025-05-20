import { PipelineStage } from 'mongoose';

export function getPetType(): PipelineStage[] {
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
  ];
}

export function getPetPopulationPipeline(): PipelineStage[] {
  return [
    ...getPetType(),
    {
      $lookup: {
        from: 'petbreeds',
        let: { breedId: '$breed' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$breedId'],
              },
            },
          },
          ...(getPetType() as any[]),
          {
            $project: {
              _id: 1,
              name: 1,
              type: 1,
            },
          },
        ],
        as: 'breed',
      },
    },
    { $unwind: { path: '$breed', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$user.userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$userId'],
              },
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              username: 1,
              profilePictureMedia: 1,
            },
          },
        ],
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ];
}

export function getPetsPipeline(): PipelineStage[] {
  return [
    ...getPetPopulationPipeline(),
    {
      $project: { _id: 1, name: 1, profilePictureMedia: 1, breed: 1, type: 1, user: 1 },
    },
  ];
}

export function getPetPipeline(): PipelineStage[] {
  return [
    ...getPetPopulationPipeline(),
    {
      $project: {
        _id: 1,
        name: 1,
        profilePictureMedia: 1,
        breed: 1,
        type: 1,
        user: 1,
        bio: 1,
        gender: 1,
        birthDate: 1,
        passportNumber: 1,
        height: 1,
        weight: 1,
        suspendedAt: 1,
        suspendedDueToUserSuspensionAt: 1,
        totalFollowers: 1,
        totalPosts: 1,
        dynamicLink: 1,
      },
    },
  ];
}
