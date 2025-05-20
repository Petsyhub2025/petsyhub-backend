import { Transform, TransformFnParams } from 'class-transformer';

export function TransformTimeStamp() {
  return Transform(({ obj, key }: TransformFnParams) => {
    return transformTimeStamp(obj[key]);
  });
}

export function transformTimeStamp(value: string | number) {
  const timestamp = Number(value);
  return new Date(timestamp);
}
