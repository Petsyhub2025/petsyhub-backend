import { Connection, HydratedDocument, Schema } from 'mongoose';
import { Favorite, IFavoriteModel, IFavoriteInstanceMethods } from './favorite.type';
import { ModelNames } from '@common/constants';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { FavoriteTypeEnum } from './favorite.enum';

const FavoriteSchema = new Schema<Favorite, IFavoriteModel, IFavoriteInstanceMethods>(
  {
    customer: { type: Schema.Types.ObjectId, ref: ModelNames.CUSTOMER, required: true },
    product: { type: Schema.Types.ObjectId, ref: ModelNames.PRODUCT, required: false },
    shop: { type: Schema.Types.ObjectId, ref: ModelNames.BASE_BRANCH, required: false },
    favoriteType: { type: String, enum: FavoriteTypeEnum, required: true },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function favoriteSchemaFactory(connection: Connection) {
  FavoriteSchema.index({ customer: 1 });
  FavoriteSchema.index({ favoriteType: 1 });

  FavoriteSchema.pre('validate', async function () {
    await validateSchema(this, Favorite);
  });

  FavoriteSchema.methods.deleteDoc = async function (this: HydratedDocument<Favorite>) {
    await this.deleteOne();
  };

  const favoriteModel = connection.model(ModelNames.FAVORITE, FavoriteSchema);

  return favoriteModel;
}
