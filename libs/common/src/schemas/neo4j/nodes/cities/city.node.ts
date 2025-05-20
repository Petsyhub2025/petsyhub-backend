import { HydratedDocument } from 'mongoose';
import { GraphBaseNode } from '../common/base-node.node';
import { NodeTypesEnum } from '../common/node-types.enum';
import { RelationTypesEnum } from '../../relations/common/relation-types.enum';
import { City } from '@common/schemas/mongoose/city/city.type';

export class GraphCityNode extends GraphBaseNode<GraphCityNode> {
  public cityId: string;
  public countryId: string;

  public static from(city: HydratedDocument<City>) {
    if (!city._id || !city.createdAt) return null;

    const graphCityNode = new GraphCityNode({
      cityId: city._id.toString(),
      countryId: city.country.toString(),
      createdAt: city.createdAt.toISOString(),
      type: NodeTypesEnum.CITY,
    });

    return graphCityNode;
  }

  public static fromArray(cities: HydratedDocument<City>[]) {
    return cities.map((city) => GraphCityNode.from(city)).filter((city) => city);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.cities as city
      MERGE (c:${NodeTypesEnum.CITY} {cityId: city.cityId})
      ON CREATE
        SET c = city
      WITH c, city
      MATCH (co:${NodeTypesEnum.COUNTRY} {countryId: city.countryId})
      MERGE (co)-[:${RelationTypesEnum.HAS_CITY} {relationType: '${RelationTypesEnum.HAS_CITY}'}]->(c)
    `;
  }
}
