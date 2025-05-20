import { Transform, TransformFnParams } from 'class-transformer';
import { Types } from 'mongoose';

const isObjectId = (id: string | Types.ObjectId) => new RegExp('^[0-9a-fA-F]{24}$').test(id?.toString() ?? '');

export function TransformObjectId() {
  return Transform(({ obj, key }: TransformFnParams) => {
    if (isObjectId(obj[key])) {
      return new Types.ObjectId(obj[key]);
    }

    return obj[key];
  });
}

export function TransformObjectIds() {
  return Transform(({ obj, key }: TransformFnParams) => {
    if (!Array.isArray(obj[key])) obj[key] = [obj[key]];

    return obj[key].map((id) => {
      if (isObjectId(id)) {
        return new Types.ObjectId(id);
      }

      return id;
    });
  });
}
