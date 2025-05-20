import { ModelNames } from '@common/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { IUserBlockInstanceMethods, IUserBlockModel, UserBlock } from './user-block.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const UserBlockSchema = new Schema<UserBlock, IUserBlockModel, IUserBlockInstanceMethods>(
  {
    blocker: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    blocked: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function userBlockSchemaFactory(connection: Connection, eventEmitter: EventEmitter2) {
  UserBlockSchema.index({ blocker: 1 });
  UserBlockSchema.index({ blocked: 1 });
  UserBlockSchema.index({ blocked: 1, createdAt: -1 });
  UserBlockSchema.index({ blocker: 1, blocked: 1 });

  UserBlockSchema.pre('validate', async function () {
    await validateSchema(this, UserBlock);
  });

  UserBlockSchema.pre('save', async function (this: HydratedDocument<UserBlock>) {
    const transactionSession = await connection.startSession();
    transactionSession.startTransaction({
      readPreference: 'primary',
    });

    const userFollowModel = connection.model(ModelNames.USER_FOLLOW);
    const petFollowModel = connection.model(ModelNames.PET_FOLLOW);
    const pendingUserFollowModel = connection.model(ModelNames.PENDING_USER_FOLLOW);
    const pendingPetFollowModel = connection.model(ModelNames.PENDING_PET_FOLLOW);
    const petModel = connection.model(ModelNames.PET);

    const userFollowCursor = userFollowModel
      .find({
        $or: [
          { follower: this.blocker, following: this.blocked },
          { follower: this.blocked, following: this.blocker },
        ],
      })
      .session(transactionSession)
      .cursor();

    for await (const userFollow of userFollowCursor) {
      await userFollow.deleteDoc();
    }

    const pendingUserFollowCursor = pendingUserFollowModel
      .find({
        $or: [
          { follower: this.blocker, following: this.blocked },
          { follower: this.blocked, following: this.blocker },
        ],
      })
      .session(transactionSession)
      .cursor();

    for await (const pendingUserFollow of pendingUserFollowCursor) {
      await pendingUserFollow.deleteDoc();
    }

    const [blockerPets, blockedPets] = await Promise.all([
      petModel.find({ 'user.userId': this.blocker }, { _id: 1 }).session(transactionSession),
      petModel.find({ 'user.userId': this.blocked }, { _id: 1 }).session(transactionSession),
    ]);

    const petFollowCursor = petFollowModel
      .find({
        $or: [
          { follower: this.blocker, following: { $in: blockedPets.map((pet) => pet._id) } },
          { follower: this.blocked, following: { $in: blockerPets.map((pet) => pet._id) } },
        ],
      })
      .session(transactionSession)
      .cursor();

    for await (const petFollow of petFollowCursor) {
      await petFollow.deleteDoc();
    }

    const pendingPetFollowCursor = pendingPetFollowModel
      .find({
        $or: [
          { follower: this.blocker, following: { $in: blockedPets.map((pet) => pet._id) } },
          { follower: this.blocked, following: { $in: blockerPets.map((pet) => pet._id) } },
        ],
      })
      .session(transactionSession)
      .cursor();

    for await (const pendingPetFollow of pendingPetFollowCursor) {
      await pendingPetFollow.deleteDoc();
    }

    await transactionSession.commitTransaction();
    transactionSession.endSession();
  });

  UserBlockSchema.methods.deleteDoc = async function (this: HydratedDocument<UserBlock>) {
    await this.deleteOne();
  };

  const userBlockModel = connection.model(ModelNames.USER_BLOCK, UserBlockSchema);

  return userBlockModel;
}
