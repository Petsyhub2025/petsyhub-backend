import Joi from 'joi';

export const mediaValidationSchema = Joi.object({
  files: Joi.array()
    .items(
      Joi.object({
        s3Key: Joi.string().optional(),
        url: Joi.string().optional(),
      })
        .unknown(true)
        .xor('s3Key', 'url'),
    )
    .optional(),
}).unknown(true);
