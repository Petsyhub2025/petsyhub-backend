import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import bcrypt from 'bcrypt';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { Customer, ICustomerInstanceMethods, ICustomerModel } from './customer.type';
import { UserGenderEnum, UserRoleEnum } from '@common/schemas/mongoose/user/user.enum';
import { OwnedPetsSubSchema } from '@common/schemas/mongoose/user/user-subschemas/owned-pets';
import { CustomerDevicesSubSchema } from './subschemas/customer-devices';
import { CustomerSettingsLanguageEnum, CustomerSettingsSubSchema } from './subschemas/customer-settings';

export const CustomerSchema = new Schema<Customer, ICustomerModel, ICustomerInstanceMethods>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: false,
    },

    googleId: {
      type: String,
      required: false,
    },

    appleId: {
      type: String,
      required: false,
    },

    socialAccountId: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: false,
    },

    gender: {
      type: String,
      enum: UserGenderEnum,
      required: false,
    },

    activeAddress: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CUSTOMER_ADDRESS,
      required: false,
    },

    ownedPets: {
      type: [OwnedPetsSubSchema],
      required: false,
      default: [],
    },

    devices: {
      type: [CustomerDevicesSubSchema],
      required: false,
      default: [],
    },

    settings: {
      type: CustomerSettingsSubSchema,
      required: false,
      default: {
        language: CustomerSettingsLanguageEnum.EN,
      },
    },

    phoneNumber: {
      type: String,
      required: false,
    },

    stripeCustomerId: { type: String, required: false },

    totalOrders: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: UserRoleEnum,
      default: UserRoleEnum.ACTIVE,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
      },
    },
  },
);

export function customerSchemaFactory(connection: Connection) {
  CustomerSchema.index({ email: 1 });
  CustomerSchema.index({ socialAccountId: 1 });
  CustomerSchema.index({ isViewable: 1 });

  //   CustomerSchema.pre('validate', async function () {
  //     const deepLink = deepLinkService.generateUserDeepLink({
  //       modelName: DeepLinkModelsEnum.USERS,
  //       modelId: this.ecommerceUsername,
  //     });

  //     const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<Customer>(
  //       this,
  //       ['ecommerceUsername', 'profilePictureMedia', 'bio', 'firstName', 'lastName'],
  //       {
  //         link: deepLink,
  //         title: this.firstName + ' ' + this.lastName,
  //         description: this.bio,
  //         imageUrl: this.profilePictureMedia?.url,
  //       },
  //     );

  //     this.dynamicLink = dynamicLink;
  //   });

  CustomerSchema.pre('validate', function (next) {
    this.isViewable = !this.deletedAt && !this.suspendedAt;
    next();
  });

  CustomerSchema.pre('validate', async function () {
    await validateSchema(this, Customer);
  });

  CustomerSchema.pre('save', async function () {
    this.wasNew = this.isNew;
  });

  CustomerSchema.methods.comparePassword = async function (this: HydratedDocument<Customer>, password: string) {
    return bcrypt.compare(password, this.password);
  };

  const customerModel = connection.model(ModelNames.CUSTOMER, CustomerSchema);

  return customerModel;
}
