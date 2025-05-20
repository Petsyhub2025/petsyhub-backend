import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import {
  IUserMessageStatusInstanceMethods,
  IUserMessageStatusModel,
  UserMessageStatus,
} from './user-message-status.type';

const UserMessageStatusSchema = new Schema<
  UserMessageStatus,
  IUserMessageStatusModel,
  IUserMessageStatusInstanceMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.USER,
    },

    room: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.BASE_CHAT_ROOM,
    },

    message: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.CHAT_MESSAGE,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function userMessageStatusSchemaFactory(connection: Connection) {
  UserMessageStatusSchema.index({ message: 1 });
  UserMessageStatusSchema.index({ user: 1, room: 1, isRead: 1 });

  UserMessageStatusSchema.pre('validate', async function () {
    await validateSchema(this, UserMessageStatus);
  });

  UserMessageStatusSchema.methods.deleteDoc = async function (this: HydratedDocument<UserMessageStatus>) {
    await this.deleteOne();
  };

  const userChatRoomRelationModel = connection.model(ModelNames.USER_MESSAGE_STATUS, UserMessageStatusSchema);

  return userChatRoomRelationModel;
}
