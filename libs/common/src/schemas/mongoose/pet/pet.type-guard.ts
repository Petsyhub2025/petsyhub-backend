import { HydratedDocument } from 'mongoose';
import { Pet } from './pet.type';

export function isPet(obj: any): obj is HydratedDocument<Pet> {
  return !!(obj && obj.type && obj.breed);
}
