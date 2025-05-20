import Joi from 'joi';

export const snsTopicMessageValidationSchema = Joi.object({
  Records: Joi.array()
    .items(
      Joi.object({
        Sns: Joi.object({
          TopicArn: Joi.string().required(),
          Message: Joi.string().required(),
        }).unknown(true),
      }).unknown(true),
    )
    .required()
    .min(1),
}).unknown(true);
