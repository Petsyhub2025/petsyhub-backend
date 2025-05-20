import * as Joi from 'joi';

export const getUserPetsSchema = Joi.object({
  userId: Joi.string().optional(),
  isPrivate: Joi.boolean().optional(),
  excludePetId: Joi.string().optional(),
})
  .unknown(true)
  .when('.userId', {
    is: Joi.exist(),
    then: Joi.object({
      isPrivate: Joi.forbidden(),
      excludePetId: Joi.forbidden(),
    }),
  });
