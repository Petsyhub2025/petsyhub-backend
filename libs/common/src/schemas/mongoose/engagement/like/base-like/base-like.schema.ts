import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, Schema } from 'mongoose';
import { BaseLike, IBaseLikeInstanceMethods, IBaseLikeModel } from './base-like.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';

const BaseLikeSchema = new Schema<BaseLike, IBaseLikeModel, IBaseLikeInstanceMethods>(
  {
    authorUser: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },
    ...BaseSchema,
  },
  {
    discriminatorKey: 'likeType',
    timestamps: true,
  },
);

export function baseLikeSchemaFactory(connection: Connection) {
  BaseLikeSchema.index(
    { authorUser: 1, post: 1 },
    { unique: true, partialFilterExpression: { post: { $exists: true } } },
  );
  BaseLikeSchema.index(
    { authorUser: 1, comment: 1 },
    { unique: true, partialFilterExpression: { comment: { $exists: true } } },
  );
  BaseLikeSchema.index(
    { authorUser: 1, commentReply: 1 },
    { unique: true, partialFilterExpression: { commentReply: { $exists: true } } },
  );

  BaseLikeSchema.pre('validate', async function () {
    await validateSchema(this, BaseLike);
  });

  const baseLikeModel = connection.model(ModelNames.BASE_LIKE, BaseLikeSchema);

  return baseLikeModel;
}
