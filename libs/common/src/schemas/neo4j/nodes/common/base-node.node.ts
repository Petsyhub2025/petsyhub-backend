import { IGraphNode } from '../../common/content.model';

export class GraphBaseNode<T> implements IGraphNode {
  public _id?: string; // Only exists during post-processing of the node
  public type: string;
  public createdAt: string;

  constructor(data: T) {
    Object.assign(this, data);
  }
}
