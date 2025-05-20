import { Post } from '@common/schemas/mongoose/post/post.type';
import { HydratedDocument } from 'mongoose';

export class GraphContentDto {
  public type: string;

  public post?: HydratedDocument<Post>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
