import { GraphAction } from '@common/schemas/neo4j/common/action.model';
import { GraphBaseNode } from '@common/schemas/neo4j/nodes/common/base-node.node';
import { Integer } from 'neo4j-driver';

export class GraphFeedNode {
  public feedId?: Integer;
  public feedOrder?: number;
  public viewerId: string;
  public action: GraphAction;
  public content: GraphBaseNode<any>;
  public contentId: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
