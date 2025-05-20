import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { IPendingPetFollowInstanceMethods, IPendingPetFollowModel, PendingPetFollow } from './pending-pet-follow.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';

const PendingPetFollowSchema = new Schema<PendingPetFollow, IPendingPetFollowModel, IPendingPetFollowInstanceMethods>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    following: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PET,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function pendingPetFollowSchemaFactory(connection: Connection) {
  PendingPetFollowSchema.index({ follower: 1 });
  PendingPetFollowSchema.index({ following: 1 });
  PendingPetFollowSchema.index({ follower: 1, following: 1 }, { unique: true });

  PendingPetFollowSchema.pre('validate', async function () {
    await validateSchema(this, PendingPetFollow);
  });

  PendingPetFollowSchema.methods.deleteDoc = async function (this: HydratedDocument<PendingPetFollow>) {
    await this.deleteOne();
  };

  const pendingPetFollowModel = connection.model(ModelNames.PENDING_PET_FOLLOW, PendingPetFollowSchema);

  return pendingPetFollowModel;
}
