import { Transform, TransformFnParams } from 'class-transformer';

export function TransformArray() {
  return Transform((fnParams: TransformFnParams) =>
    Array.isArray(fnParams.value) ? fnParams.value : [fnParams.value],
  );
}
