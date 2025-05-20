import { HydratedDocument } from 'mongoose';
import { NodeTypesEnum } from '../../nodes/common/node-types.enum';
import { GraphBaseRelation } from '../common/base-relation.relation';
import { RelationTypesEnum } from '../common/relation-types.enum';
import { PetFollow } from '@common/schemas/mongoose/pet/pet-follow/pet-follow.type';

export class GraphPetFollowRelation extends GraphBaseRelation<GraphPetFollowRelation> {
  public followId: string;
  public follower: string;
  public following: string;

  public static from(follow: HydratedDocument<PetFollow>) {
    if (!follow._id || !follow.follower || !follow.following || !follow.createdAt) return null;

    const petFollowRelation = new GraphPetFollowRelation({
      followId: follow._id.toString(),
      follower: follow.follower.toString(),
      following: follow.following.toString(),
      createdAt: follow.createdAt.toISOString(),
      relationType: RelationTypesEnum.FOLLOWS,
      type: 'PetFollow',
    });

    return petFollowRelation;
  }

  public static fromArray(follows: HydratedDocument<PetFollow>[]) {
    return follows.map((follow) => GraphPetFollowRelation.from(follow)).filter((follow) => follow);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.petFollows as petFollow
      MATCH (follower:${NodeTypesEnum.USER} {userId: petFollow.follower}),
            (following:${NodeTypesEnum.PET} {petId: petFollow.following}),
            (petType:${NodeTypesEnum.PET_TYPE} {typeId: following.petType})
      MERGE (follower)-[:${RelationTypesEnum.FOLLOWS} {followId: petFollow.followId, type: petFollow.type, follower: petFollow.follower, following: petFollow.following, createdAt: datetime(petFollow.createdAt), relationType: petFollow.relationType}]->(following)
      CREATE (follower)-[iw:${RelationTypesEnum.INTERACTED_WITH} {interactionDate: datetime(petFollow.createdAt), relationType: '${RelationTypesEnum.INTERACTED_WITH}'}]->(petType)
    `;
  }
}
