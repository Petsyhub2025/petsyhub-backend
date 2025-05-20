import { HydratedDocument } from 'mongoose';
import { GraphBaseNode } from '../common/base-node.node';
import { NodeTypesEnum } from '../common/node-types.enum';
import { Country } from '@common/schemas/mongoose/country/country.type';

export class GraphCountryNode extends GraphBaseNode<GraphCountryNode> {
  public countryId: string;

  public static from(country: HydratedDocument<Country>) {
    if (!country._id || !country.createdAt) return null;

    const graphCountryNode = new GraphCountryNode({
      countryId: country._id.toString(),
      createdAt: country.createdAt.toISOString(),
      type: NodeTypesEnum.COUNTRY,
    });

    return graphCountryNode;
  }

  public static fromArray(countries: HydratedDocument<Country>[]) {
    return countries.map((country) => GraphCountryNode.from(country)).filter((country) => country);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.countries as country
      MERGE (c:${NodeTypesEnum.COUNTRY} {countryId: country.countryId})
      ON CREATE
        SET c = country
    `;
  }
}
