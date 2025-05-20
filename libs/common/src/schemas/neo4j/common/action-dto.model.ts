import { Pet } from '@common/schemas/mongoose/pet/pet.type';
import { User } from '@common/schemas/mongoose/user/user.type';
import { HydratedDocument } from 'mongoose';

export class GraphActionDto {
  public type: string;
  public actor: HydratedDocument<Pet> | HydratedDocument<User>;
  public data: any;
  public actionCreationDate: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
