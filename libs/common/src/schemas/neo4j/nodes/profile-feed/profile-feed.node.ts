import { GraphAction } from '../../common/action.model';
import { GraphBaseNode } from '../common/base-node.node';

export class GraphProfileFeedNode {
  public viewerId: string;
  public action: GraphAction | string;
  public content: GraphBaseNode<any> | string;
  public contentId: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
