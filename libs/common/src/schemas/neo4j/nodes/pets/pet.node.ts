import { HydratedDocument } from 'mongoose';
import { GraphBaseNode } from '@common/schemas/neo4j/nodes/common/base-node.node';
import { NodeTypesEnum } from '@common/schemas/neo4j/nodes/common/node-types.enum';
import { RelationTypesEnum } from '@common/schemas/neo4j/relations/common/relation-types.enum';
import { Pet } from '@common/schemas/mongoose/pet/pet.type';

export class GraphPetNode extends GraphBaseNode<GraphPetNode> {
  public petId: string;
  public petType: string;
  public petBreed: string;
  public userId: string;
  public isPrivate: boolean;

  public static from(pet: HydratedDocument<Pet>) {
    if (!pet._id || !pet.createdAt) return null;

    const graphPetNode = new GraphPetNode({
      petId: pet._id.toString(),
      petType: pet.type.toString(),
      petBreed: pet.breed.toString(),
      userId: pet.user.userId.toString(),
      isPrivate: pet.isPrivate,
      createdAt: pet.createdAt.toISOString(),
      type: NodeTypesEnum.PET,
    });

    return graphPetNode;
  }

  public static fromArray(pets: HydratedDocument<Pet>[]) {
    return pets.map((pet) => GraphPetNode.from(pet)).filter((pet) => pet);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.pets as pet
      MERGE (p:${NodeTypesEnum.PET} {petId: pet.petId})
      ON CREATE
        SET p = pet
      ON MATCH
        SET p.isPrivate = pet.isPrivate
      WITH p, pet
      MATCH (u:${NodeTypesEnum.USER} {userId: pet.userId})
      OPTIONAL MATCH (pt:${NodeTypesEnum.PET_TYPE} {typeId: pet.petType})
      MERGE (u)-[:${RelationTypesEnum.HAS_PET} {relationType: '${RelationTypesEnum.HAS_PET}'}]->(p)
      FOREACH (ignoreMe IN CASE WHEN pt IS NOT NULL THEN [1] ELSE [] END |
        MERGE (p)-[:${RelationTypesEnum.IS_PET_TYPE} {relationType: '${RelationTypesEnum.IS_PET_TYPE}'}]->(pt)
        CREATE (u)-[iw:${RelationTypesEnum.INTERACTED_WITH} {interactionDate: datetime(pet.createdAt), relationType: '${RelationTypesEnum.INTERACTED_WITH}'}]->(pt)
      )
    `;
  }
}
