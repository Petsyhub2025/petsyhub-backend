import { HydratedDocument, Types } from 'mongoose';
import { GraphBaseNode } from '@common/schemas/neo4j/nodes/common/base-node.node';
import { NodeTypesEnum } from '@common/schemas/neo4j/nodes/common/node-types.enum';
import { RelationTypesEnum } from '@common/schemas/neo4j/relations/common/relation-types.enum';
import { User } from '@common/schemas/mongoose/user/user.type';

type UserWithCityCountry = HydratedDocument<User> & { city: Types.ObjectId; country: Types.ObjectId };

export class GraphUserNode extends GraphBaseNode<GraphUserNode> {
  public userId: string;
  public city: string;
  public country: string;
  public isPrivate: boolean;
  public latestActivityDate?: string;

  public static from(user: UserWithCityCountry) {
    if (!user._id || !user.createdAt) return null;

    const graphUserNode = new GraphUserNode({
      userId: user._id.toString(),
      city: user.city?.toString() ?? 'na',
      country: user.country?.toString() ?? 'na',
      isPrivate: user.isPrivate,
      createdAt: user.createdAt.toISOString(),
      type: NodeTypesEnum.USER,
    });

    return graphUserNode;
  }

  public static fromArray(users: UserWithCityCountry[]) {
    return users.map((user) => GraphUserNode.from(user)).filter((user) => user);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.users as user
      MERGE (u:${NodeTypesEnum.USER} {userId: user.userId})
      ON CREATE
        SET u.type = user.type,
            u.createdAt = user.createdAt,
            u.latestActivityDate = user.createdAt,
            u.isPrivate = user.isPrivate
      ON MATCH
        SET u.isPrivate = user.isPrivate
      WITH u, user
      OPTIONAL MATCH (c:${NodeTypesEnum.CITY} {cityId: user.city})
      OPTIONAL MATCH (co:${NodeTypesEnum.COUNTRY} {countryId: user.country})
      FOREACH(unUsedValue IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END |
        MERGE (u)-[:${RelationTypesEnum.LIVES_IN_CITY} {relationType: '${RelationTypesEnum.LIVES_IN_CITY}'}]->(c)
      )
      FOREACH(unUsedValue IN CASE WHEN co IS NOT NULL THEN [1] ELSE [] END |
        MERGE (u)-[:${RelationTypesEnum.LIVES_IN_COUNTRY} {relationType: '${RelationTypesEnum.LIVES_IN_COUNTRY}'}]->(co)
      )
    `;
  }
}
