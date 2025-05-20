import { HydratedDocument } from 'mongoose';
import { User } from './user.type';

export function isUser(obj: any): obj is HydratedDocument<User> {
  return !!(obj && obj.username);
}
