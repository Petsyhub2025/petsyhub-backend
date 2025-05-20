import { GraphBaseRelation } from '@common/schemas/neo4j/relations/common/base-relation.relation';

export class GraphPostedRelation extends GraphBaseRelation<GraphPostedRelation> {
  public user: string;
}
