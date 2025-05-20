import { HydratedDocument } from 'mongoose';
import { GraphBaseNode } from '../common/base-node.node';
import { NodeTypesEnum } from '../common/node-types.enum';
import { PetType } from '@common/schemas/mongoose/pet/pet-type';

export class GraphPetTypeNode extends GraphBaseNode<GraphPetTypeNode> {
  public typeId: string;
  public name: string;

  public static from(petType: HydratedDocument<PetType>) {
    if (!petType._id || !petType.name) return null;

    const graphPetTypeNode = new GraphPetTypeNode({
      typeId: petType._id.toString(),
      name: petType.name.en,
      createdAt: petType.createdAt.toISOString(),
      type: NodeTypesEnum.PET_TYPE,
    });

    return graphPetTypeNode;
  }

  public static fromArray(petTypes: HydratedDocument<PetType>[]) {
    return petTypes.map((petType) => GraphPetTypeNode.from(petType)).filter((petType) => petType);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.petTypes as petType
      MERGE (p:${NodeTypesEnum.PET_TYPE} {typeId: petType.typeId})
      ON CREATE
        SET p = petType
      ON MATCH
        SET p.name = petType.name
    `;
  }
}
