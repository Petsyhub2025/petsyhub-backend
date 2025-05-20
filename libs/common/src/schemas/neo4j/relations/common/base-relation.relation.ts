import { RelationTypesEnum } from './relation-types.enum';

export class GraphBaseRelation<T> {
  public type?: string;
  public userType?: string;
  public createdAt: string;
  public relationType: RelationTypesEnum;

  constructor(data: T) {
    Object.assign(this, data);
  }
}
