import Joi from 'joi';

export const jobCompletionValidationSchema = Joi.object({
  JobId: Joi.string().required(),
  Status: Joi.string().required(),
}).unknown(true);
