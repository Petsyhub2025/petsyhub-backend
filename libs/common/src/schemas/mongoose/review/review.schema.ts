import { Connection, Schema } from 'mongoose';
import { Review, IReviewInstanceMethods, IReviewModel } from './review.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ModelNames } from '@common/constants';

const ReviewSchema = new Schema<Review, IReviewModel, IReviewInstanceMethods>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CUSTOMER,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    branch: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.BASE_BRANCH,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function reviewSchemaFactory(connection: Connection) {
  ReviewSchema.index({ branch: 1 });

  ReviewSchema.pre('validate', async function () {
    await validateSchema(this, Review);
  });

  const reviewModel = connection.model(ModelNames.REVIEW, ReviewSchema);

  return reviewModel;
}
