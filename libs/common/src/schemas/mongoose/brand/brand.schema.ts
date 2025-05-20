import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { Brand, IBrandInstanceMethods, IBrandModel } from './brand.type';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { BrandTypeEnum } from './brand.enum';

export const BrandSchema = new Schema<Brand, IBrandModel, IBrandInstanceMethods>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: false,
    },
    logoPictureMedia: { type: MediaSchema, required: false },
    logoPictureMediaProcessingId: { type: String, required: false },
    coverPictureMedia: { type: MediaSchema, required: false },
    coverPictureMediaProcessingId: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    anotherPhoneNumber: { type: String, required: false },
    hotline: { type: String, required: false },
    cities: { type: [Schema.Types.ObjectId], ref: ModelNames.CITY, default: [] },
    countries: { type: [Schema.Types.ObjectId], ref: ModelNames.COUNTRY, default: [] },
    areas: { type: [Schema.Types.ObjectId], ref: ModelNames.AREA, default: [] },
    bio: { type: String, required: false },
    brandType: { type: String, enum: BrandTypeEnum, required: true },
    ...BaseSchema,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
      },
    },
  },
);

export function brandSchemaFactory(connection: Connection) {
  BrandSchema.index({ areas: 1 });
  BrandSchema.index({ cities: 1 });
  BrandSchema.index({ countries: 1 });
  BrandSchema.index({ brandType: 1 });

  BrandSchema.pre('validate', async function () {
    await validateSchema(this, Brand);
  });

  BrandSchema.methods.deleteDoc = async function (this: HydratedDocument<Brand>) {
    await this.deleteOne();
  };

  const brandModel = connection.model(ModelNames.BRAND, BrandSchema);

  return brandModel;
}
