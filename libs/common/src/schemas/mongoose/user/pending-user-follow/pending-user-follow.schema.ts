import { ModelNames } from '@common/constants';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import {
  IPendingUserFollowInstanceMethods,
  IPendingUserFollowModel,
  PendingUserFollow,
} from './pending-user-follow.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const PendingUserFollowSchema = new Schema<
  PendingUserFollow,
  IPendingUserFollowModel,
  IPendingUserFollowInstanceMethods
>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    following: {
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

export function pendingUserFollowSchemaFactory(connection: Connection) {
  PendingUserFollowSchema.index({ follower: 1 });
  PendingUserFollowSchema.index({ following: 1 });
  PendingUserFollowSchema.index({ follower: 1, following: 1 }, { unique: true });

  PendingUserFollowSchema.pre('validate', async function () {
    await validateSchema(this, PendingUserFollow);
  });

  PendingUserFollowSchema.methods.deleteDoc = async function (this: HydratedDocument<PendingUserFollow>) {
    await this.deleteOne();
  };

  const pendingUserFollowModel = connection.model(ModelNames.PENDING_USER_FOLLOW, PendingUserFollowSchema);

  return pendingUserFollowModel;
}
