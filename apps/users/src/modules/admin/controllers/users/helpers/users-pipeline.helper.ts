import { PipelineStage } from 'mongoose';

export function getUsersPipeline(): PipelineStage[] {
  return [
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        username: 1,
        profilePictureMedia: 1,
        role: 1,
        blockedAt: 1,
        suspendedAt: 1,
        totalPets: 1,
        totalPosts: 1,
        totalFollowers: 1,
        totalPetFollowings: 1,
        totalUserFollowings: 1,
        createdAt: 1,
        dynamicLink: 1,
      },
    },
  ];
}
