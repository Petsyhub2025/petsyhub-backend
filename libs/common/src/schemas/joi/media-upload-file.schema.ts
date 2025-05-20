import Joi from 'joi';

export const mediaUploadFileSchema = Joi.object({
  s3Key: Joi.string().optional(),
  url: Joi.string().optional(),
})
  .unknown(true)
  .xor('s3Key', 'url');

export const mediaS3FileSchema = Joi.object({
  s3Key: Joi.string().required(),
  url: Joi.string().optional(),
})
  .unknown(true)
  .without('s3Key', 'url');

// const multipleMediaS3FileSchema = Joi.array().items(singleMediaS3FileSchema);

// const multipleMediaUploadFileSchema = Joi.array().items(singleMediaUploadFileSchema);

// export const mediaUploadFileSchema = Joi.alternatives().try(singleMediaUploadFileSchema, multipleMediaUploadFileSchema);
// export const mediaS3FileSchema = Joi.alternatives().try(singleMediaS3FileSchema, multipleMediaS3FileSchema);
