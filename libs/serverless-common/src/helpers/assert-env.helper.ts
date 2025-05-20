import { baseConfigObject } from '@common/schemas/joi';
import Joi from 'joi';

export function assertEnv() {
  const schema = Joi.object({
    ...baseConfigObject,
  }).unknown(true);

  const { error } = schema.validate(process.env);

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
}
