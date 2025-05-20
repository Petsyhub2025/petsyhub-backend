import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import {
  IUserChatRoomRelationInstanceMethods,
  IUserChatRoomRelationModel,
  UserChatRoomRelation,
} from './user-chat-room-relation.type';
import {
  UserChatRoomRelationChatRequestStatusEnum,
  UserChatRoomRelationRoleEnum,
  UserChatRoomRelationStatusEnum,
} from './user-chat-room-relation.enum';

const UserChatRoomRelationSchema = new Schema<
  UserChatRoomRelation,
  IUserChatRoomRelationModel,
  IUserChatRoomRelationInstanceMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.USER,
    },

    role: {
      type: String,
      enum: UserChatRoomRelationRoleEnum,
      default: UserChatRoomRelationRoleEnum.MEMBER,
    },

    room: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.BASE_CHAT_ROOM,
    },

    status: {
      type: String,
      enum: UserChatRoomRelationStatusEnum,
      default: UserChatRoomRelationStatusEnum.ACTIVE,
    },

    lastJoinDate: {
      type: Date,
      required: true,
    },

    lastLeaveDate: {
      type: Date,
      default: null,
    },

    lastMessageClearDate: {
      type: Date,
      default: null,
    },

    lastMessageSeenDate: {
      type: Date,
      default: null,
    },

    lastMessageSeenId: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CHAT_MESSAGE,
    },

    messageFilterStartDate: {
      type: Date,
      default: null,
    },

    chatRequesterId: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: false,
      default: null,
    },

    chatRequestStatus: {
      type: String,
      enum: UserChatRoomRelationChatRequestStatusEnum,
      default: UserChatRoomRelationChatRequestStatusEnum.NONE,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function userChatRoomRelationSchemaFactory(connection: Connection) {
  UserChatRoomRelationSchema.index({ room: 1 });
  UserChatRoomRelationSchema.index({ user: 1, room: 1 });
  UserChatRoomRelationSchema.index({ user: 1, chatRequesterId: 1 });
  UserChatRoomRelationSchema.index({ room: 1, status: 1 });
  UserChatRoomRelationSchema.index({ user: 1, room: 1, status: 1 });

  UserChatRoomRelationSchema.pre('validate', async function () {
    await validateSchema(this, UserChatRoomRelation);
  });

  UserChatRoomRelationSchema.pre('save', function (next) {
    const lastJoinDate = new Date(this.lastJoinDate);
    const lastLeaveDate = new Date(this.lastLeaveDate);
    const lastMessageClearDate = new Date(this.lastMessageClearDate);

    const isMessageClearDate =
      this.lastMessageClearDate && lastMessageClearDate > lastJoinDate && lastMessageClearDate > lastLeaveDate;
    const isLeaveDate = !!this.lastLeaveDate;

    if (isMessageClearDate) {
      this.messageFilterStartDate = lastMessageClearDate;
      return next();
    }

    if (isLeaveDate) {
      this.messageFilterStartDate = lastLeaveDate;
      return next();
    }

    this.messageFilterStartDate = lastJoinDate;

    next();
  });

  UserChatRoomRelationSchema.methods.deleteDoc = async function (this: HydratedDocument<UserChatRoomRelation>) {
    this.deletedAt = new Date();
    await this.save();
  };

  const userChatRoomRelationModel = connection.model(ModelNames.USER_CHAT_ROOM_RELATION, UserChatRoomRelationSchema);

  return userChatRoomRelationModel;
}
