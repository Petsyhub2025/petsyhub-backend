import { ModelNames } from '@common/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientSession, Connection, HydratedDocument, Schema } from 'mongoose';
import { UserFollowEventsEnum } from './user-follow.enum';
import { IUserFollowInstanceMethods, IUserFollowModel, UserFollow } from './user-follow.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';

const UserFollowSchema = new Schema<UserFollow, IUserFollowModel, IUserFollowInstanceMethods>(
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

export function userFollowSchemaFactory(connection: Connection, eventEmitter: EventEmitter2) {
  UserFollowSchema.index({ follower: 1 });
  UserFollowSchema.index({ following: 1 });
  UserFollowSchema.index({ following: 1, createdAt: -1 });
  UserFollowSchema.index({ follower: 1, following: 1 }, { unique: true });

  UserFollowSchema.pre('validate', async function () {
    await validateSchema(this, UserFollow);
  });

  UserFollowSchema.post('save', async function () {
    eventEmitter.emit(UserFollowEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, this);
  });

  UserFollowSchema.methods.deleteDoc = async function (this: HydratedDocument<UserFollow>, session?: ClientSession) {
    await this.deleteOne({ session });

    eventEmitter.emit(UserFollowEventsEnum.DELETE_DOC, this);
  };

  const userFollowModel = connection.model(ModelNames.USER_FOLLOW, UserFollowSchema);

  return userFollowModel;
}
