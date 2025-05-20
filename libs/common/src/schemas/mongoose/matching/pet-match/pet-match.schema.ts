import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { PetMatchEventsEnum, PetMatchStatusEnum } from './pet-match.enum';
import { IPetMatchInstanceMethods, IPetMatchModel, PetMatch } from './pet-match.type';

const PetMatchSchema = new Schema<PetMatch, IPetMatchModel, IPetMatchInstanceMethods>(
  {
    receiverUser: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.USER,
    },

    requesterUser: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.USER,
    },

    pet: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.PET,
    },

    status: {
      type: String,
      enum: PetMatchStatusEnum,
      required: true,
      default: PetMatchStatusEnum.PENDING,
    },

    expiresAt: {
      type: Date,
      required: false,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function petMatchSchemaFactory(connection: Connection, eventEmitter: EventEmitter2) {
  PetMatchSchema.index({ receiverUser: 1 });
  PetMatchSchema.index({ requesterUser: 1 });
  PetMatchSchema.index({ pet: 1 });
  PetMatchSchema.index({ receiverUser: 1, requesterUser: 1 });
  PetMatchSchema.index({ receiverUser: 1, pet: 1 });
  PetMatchSchema.index({ receiverUser: 1, status: 1 });
  PetMatchSchema.index({ requesterUser: 1, pet: 1 });
  PetMatchSchema.index({ receiverUser: 1, requesterUser: 1, pet: 1 });
  PetMatchSchema.index({ receiverUser: 1, requesterUser: 1, pet: 1, status: 1 });
  PetMatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  PetMatchSchema.pre('validate', async function () {
    if (!this.isNew) return;

    const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + SEVEN_DAYS_IN_MILLISECONDS);
  });

  PetMatchSchema.pre('validate', async function () {
    await validateSchema(this, PetMatch);
  });

  PetMatchSchema.pre('save', async function () {
    if (this.status !== PetMatchStatusEnum.ACCEPTED) return;

    this.expiresAt = undefined;
  });

  PetMatchSchema.methods.deleteDoc = async function (this: HydratedDocument<PetMatch>) {
    await this.deleteOne();
  };

  const petMatchModel = connection.model(ModelNames.PET_MATCH, PetMatchSchema);

  return petMatchModel;
}
