import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { PetFollowEventsEnum } from './pet-follow.enum';
import { IPetFollowInstanceMethods, IPetFollowModel, PetFollow } from './pet-follow.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';

const PetFollowSchema = new Schema<PetFollow, IPetFollowModel, IPetFollowInstanceMethods>(
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

export function petFollowSchemaFactory(connection: Connection, eventEmitter: EventEmitter2) {
  PetFollowSchema.index({ follower: 1 });
  PetFollowSchema.index({ following: 1 });
  PetFollowSchema.index({ following: 1, createdAt: -1 });
  PetFollowSchema.index({ follower: 1, following: 1 }, { unique: true });

  PetFollowSchema.pre('validate', async function () {
    await validateSchema(this, PetFollow);
  });

  PetFollowSchema.post('save', async function () {
    eventEmitter.emit(PetFollowEventsEnum.POST_SAVE_UPDATE_COUNTS, this);
  });

  PetFollowSchema.methods.deleteDoc = async function (this: HydratedDocument<PetFollow>) {
    await this.deleteOne();

    eventEmitter.emit(PetFollowEventsEnum.DELETE_DOC, this);
  };

  const petFollowModel = connection.model(ModelNames.PET_FOLLOW, PetFollowSchema);

  return petFollowModel;
}
