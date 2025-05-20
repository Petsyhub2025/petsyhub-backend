import { GraphBaseRelation } from '../relations/common/base-relation.relation';

export class GraphAction {
  public type: string;
  public actor: string;
  public data: GraphBaseRelation<any>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
