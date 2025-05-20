import { HydratedDocument } from 'mongoose';
import { GraphBaseRelation } from '@common/schemas/neo4j/relations/common/base-relation.relation';
import { RelationTypesEnum } from '@common/schemas/neo4j/relations/common/relation-types.enum';
import { NodeTypesEnum } from '@common/schemas/neo4j/nodes/common/node-types.enum';
import { PetMatch } from '@common/schemas/mongoose/matching/pet-match';

export class GraphRequestedPetMatchRelation extends GraphBaseRelation<GraphRequestedPetMatchRelation> {
  public petMatchId: string;
  public requesterUserId: string;
  public petId: string;

  public static from(petMatch: HydratedDocument<PetMatch>) {
    if (!petMatch._id || !petMatch.requesterUser || !petMatch.pet || !petMatch.createdAt) return null;

    const requestedPetMatchRelation = new GraphRequestedPetMatchRelation({
      petMatchId: petMatch._id.toString(),
      requesterUserId: petMatch.requesterUser.toString(),
      petId: petMatch.pet.toString(),
      createdAt: petMatch.createdAt.toISOString(),
      relationType: RelationTypesEnum.REQUESTED_MATCH,
      type: 'PetMatch',
    });

    return requestedPetMatchRelation;
  }

  public static fromArray(follows: HydratedDocument<PetMatch>[]) {
    return follows.map((follow) => GraphRequestedPetMatchRelation.from(follow)).filter((follow) => follow);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.petMatches as petMatch
      MATCH (requester:${NodeTypesEnum.USER} {userId: petMatch.requesterUserId}),
            (pet:${NodeTypesEnum.PET} {petId: petMatch.petId})
      MERGE (requester)-[:${RelationTypesEnum.REQUESTED_MATCH} {petMatchId: petMatch.petMatchId, createdAt: datetime(petMatch.createdAt), relationType: petMatch.relationType}]->(pet)
    `;
  }
}
